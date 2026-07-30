import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaFineRuleRepository } from "@/modules/fees/infrastructure/prisma-fine-rule.repository";
import { computeFine, resolveFineRule } from "@/modules/fees/application/compute-fine.helpers";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { StudentNotEnrolledInSessionError, StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaFeeInvoiceRepository } from "@/modules/fees/infrastructure/prisma-fee-invoice.repository";
import { PrismaFeeNumberSequenceRepository } from "@/modules/fees/infrastructure/prisma-fee-number-sequence.repository";
import { appendLedgerEntry } from "@/modules/fees/application/fee-ledger.helpers";
import { recordFeeAudit } from "@/modules/fees/application/fee-audit.helpers";
import { toFeeInvoiceDTO } from "@/modules/fees/application/fee-invoice.mapper";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";
import { PrismaBookIssueRepository } from "../infrastructure/prisma-book-issue.repository";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import {
  BookIssueNotFoundError,
  BookNotFoundError,
  FineNotApplicableError,
  InvalidLibraryOperationError,
  InvoiceAlreadyGeneratedForIssueError,
} from "../domain/errors";
import { generateLibraryFineInvoiceSchema } from "./dto/fine.dto";
import { waiveBookIssueFineSchema } from "./dto/circulation.dto";
import type { LibraryFineEstimateDTO } from "./dto/fine.dto";
import type { BookIssueEntity } from "../domain/book-issue.entity";
import type { BookEntity } from "../domain/book.entity";
import type { BookIssueDTO } from "./dto/circulation.dto";
import { toBookIssueDTO } from "./book-circulation.service";
import type { LibraryContext } from "./library.service";
import { resolveMemberDisplayName } from "./library-member.helpers";

export interface LibraryFineCandidateDTO {
  bookIssueId: string;
  bookTitle: string;
  memberType: BookIssueEntity["memberType"];
  memberId: string;
  memberName: string;
  reason: LibraryFineEstimateDTO["reason"];
  amount: number;
  canInvoice: boolean;
}

// Every book issue with a non-zero live-computed fine that hasn't already been invoiced or
// waived — backs the Fine Management UI's candidate list. `canInvoice` is false for Teacher/Staff
// members (see the module's own comment on why only students can be billed through FeeInvoice).
export async function listFineCandidates(tenantId: string, libraryId: string): Promise<LibraryFineCandidateDTO[]> {
  const issueRepository = new PrismaBookIssueRepository();
  const copyRepository = new PrismaBookCopyRepository();
  const bookRepository = new PrismaBookRepository();
  const invoiceRepository = new PrismaFeeInvoiceRepository();

  const issues = await issueRepository.findByLibrary(tenantId, libraryId);
  const candidates: LibraryFineCandidateDTO[] = [];
  const today = new Date();

  for (const issue of issues) {
    if (issue.fineWaived) continue;
    const existingInvoice = await invoiceRepository.findByBookIssue(tenantId, issue.id);
    if (existingInvoice) continue;

    const copy = await copyRepository.findById(tenantId, issue.bookCopyId);
    if (!copy) continue;
    const book = await bookRepository.findById(tenantId, copy.bookId);
    if (!book) continue;

    const estimate = await estimateLibraryFine(tenantId, issue, book, "", today);
    if (estimate.amount <= 0) continue;

    const memberName = await resolveMemberDisplayName(tenantId, issue.memberType, issue.memberId).catch(() => "Unknown");
    candidates.push({
      bookIssueId: issue.id,
      bookTitle: book.title,
      memberType: issue.memberType,
      memberId: issue.memberId,
      memberName,
      reason: estimate.reason,
      amount: estimate.amount,
      canInvoice: issue.memberType === "STUDENT",
    });
  }

  return candidates;
}

// Reuses the existing generic FineRule/computeFine() helper (PER_DAY grace-period calculation) —
// no new "LibraryFeeRule" rate table. Lost/Damaged fines default to the Book's own
// replacementCost instead, since a per-day rule doesn't model "replace the book." Both branches
// are pure/live-computed, never persisted until an invoice is actually generated (mirrors
// FeeInvoice's own OVERDUE/fine lazy-computation precedent).
export async function estimateLibraryFine(
  tenantId: string,
  bookIssue: BookIssueEntity,
  book: BookEntity,
  feeCategoryId: string,
  asOfDate: Date
): Promise<LibraryFineEstimateDTO> {
  if (bookIssue.fineWaived) {
    return { bookIssueId: bookIssue.id, reason: "NONE", amount: 0 };
  }

  if (bookIssue.status === "LOST") {
    return { bookIssueId: bookIssue.id, reason: "LOST", amount: book.replacementCost };
  }
  if (bookIssue.status === "DAMAGED") {
    return { bookIssueId: bookIssue.id, reason: "DAMAGED", amount: book.replacementCost };
  }

  const compareDate = bookIssue.returnDate ?? asOfDate;
  if (compareDate <= bookIssue.dueDate) {
    return { bookIssueId: bookIssue.id, reason: "NONE", amount: 0 };
  }

  const sessions = await listActiveAcademicSessions({ tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) {
    return { bookIssueId: bookIssue.id, reason: "LATE", amount: 0 };
  }

  const fineRuleRepository = new PrismaFineRuleRepository();
  const rules = await fineRuleRepository.findByAcademicSession(tenantId, currentSession.id);
  const activeRules = rules.filter((r) => r.isActive);
  // `feeCategoryId` is empty when called for a preview (listFineCandidates) before the librarian
  // has chosen which category to bill under — resolveFineRule's own category-specific/catch-all
  // resolution has nothing to match against in that case, so fall back to the first active rule
  // for the session as a best-effort estimate. generateLibraryFineInvoice always passes the real,
  // librarian-chosen feeCategoryId, so the actual invoiced amount is never affected by this
  // fallback.
  const rule = feeCategoryId ? resolveFineRule(activeRules, feeCategoryId) : (activeRules[0] ?? null);
  const amount = computeFine({ amount: 0, dueDate: bookIssue.dueDate, asOfDate: compareDate }, rule);
  return { bookIssueId: bookIssue.id, reason: "LATE", amount };
}

// Materializes a fine as a real FeeInvoice — reuses 100% of the Phase 8 collection/reversal/
// ledger/receipt/report pipeline, exactly like generateHostelOneTimeInvoice. Only ever works for
// STUDENT members: FeeInvoice.studentId is a required column, a hard Phase 8 constraint this
// phase must not break. Teacher/Staff fines stay as a live-computed amount plus the
// fineWaived/fineWaivedBy administrator-override fields directly on BookIssue instead.
export async function generateLibraryFineInvoice(
  bookIssueId: string,
  input: unknown,
  context: LibraryContext
): Promise<FeeInvoiceDTO> {
  const parsed = generateLibraryFineInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fine invoice request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const issueRepository = new PrismaBookIssueRepository();
  const issue = await issueRepository.findById(tenantId, bookIssueId);
  if (!issue) throw new BookIssueNotFoundError();
  if (issue.memberType !== "STUDENT") {
    throw new InvalidLibraryOperationError(
      "Only student members can be billed through a Fee Invoice — use the fine waiver for Teacher/Staff members."
    );
  }
  if (issue.fineWaived) throw new FineNotApplicableError("This book issue's fine has been waived.");

  const copyRepository = new PrismaBookCopyRepository();
  const copy = await copyRepository.findById(tenantId, issue.bookCopyId);
  if (!copy) throw new BookNotFoundError();
  const bookRepository = new PrismaBookRepository();
  const book = await bookRepository.findById(tenantId, copy.bookId);
  if (!book) throw new BookNotFoundError();

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const existingInvoice = await invoiceRepository.findByBookIssue(tenantId, bookIssueId);
  if (existingInvoice) throw new InvoiceAlreadyGeneratedForIssueError();

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, issue.memberId);
  if (!student || student.deletedAt !== null) throw new StudentNotFoundError();

  const estimate = await estimateLibraryFine(tenantId, issue, book, data.feeCategoryId, new Date());
  const amount = data.overrideAmount ?? estimate.amount;
  if (amount <= 0) throw new FineNotApplicableError();

  const sessions = await listActiveAcademicSessions({ tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) throw new StudentNotEnrolledInSessionError();

  const enrollment = await getCurrentEnrollmentForStudent(issue.memberId, currentSession.id, { tenantId });
  if (!enrollment) throw new StudentNotEnrolledInSessionError();

  const sequenceRepository = new PrismaFeeNumberSequenceRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const invoiceNumber = await sequenceRepository.nextNumber(tenantId, enrollment.academicSessionId, "INVOICE", tx);
    const invoice = await invoiceRepository.create(
      {
        tenantId,
        studentId: issue.memberId,
        academicSessionId: enrollment.academicSessionId,
        classId: enrollment.classId,
        feeCategoryId: data.feeCategoryId,
        bookIssueId: issue.id,
        invoiceNumber,
        billingPeriod: "LIBRARY_FINE",
        amount,
        dueDate: new Date(),
        createdBy: actingUserId,
      },
      tx
    );

    await appendLedgerEntry(
      {
        tenantId,
        studentId: issue.memberId,
        academicSessionId: enrollment.academicSessionId,
        entryType: "INVOICE",
        referenceType: "FeeInvoice",
        referenceId: invoice.id,
        debit: amount,
        description: `Library fine invoice ${invoice.invoiceNumber} generated (${estimate.reason.toLowerCase()})`,
        createdBy: actingUserId,
      },
      tx
    );

    await recordFeeAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "LIBRARY_FINE_INVOICE_GENERATED",
        entityType: "FeeInvoice",
        entityId: invoice.id,
        afterState: invoice,
      },
      tx
    );

    return toFeeInvoiceDTO(invoice);
  });
}

// Administrator override — waives the fine for one BookIssue, for ANY member type. Only usable
// before a student's fine has been invoiced; once invoiced, correction goes through the existing
// Fee concession/reversal flow instead (never by re-editing BookIssue).
export async function waiveBookIssueFine(issueId: string, input: unknown, context: LibraryContext): Promise<BookIssueDTO> {
  const parsed = waiveBookIssueFineSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "A reason is required.");
  }
  const { tenantId, actingUserId } = context;

  const issueRepository = new PrismaBookIssueRepository();
  const issue = await issueRepository.findById(tenantId, issueId);
  if (!issue) throw new BookIssueNotFoundError();

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const existingInvoice = await invoiceRepository.findByBookIssue(tenantId, issueId);
  if (existingInvoice) {
    throw new InvalidLibraryOperationError(
      "This fine has already been invoiced — use the Fee module's concession or reversal flow instead."
    );
  }

  const waived = await issueRepository.waiveFine(tenantId, issueId, {
    fineWaivedBy: actingUserId,
    fineWaivedReason: parsed.data.reason,
    fineWaivedAt: new Date(),
  });
  return toBookIssueDTO(waived);
}
