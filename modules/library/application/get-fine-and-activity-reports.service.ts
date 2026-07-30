import "server-only";
import { listFeeInvoices } from "@/modules/fees/application/list-invoices.service";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaBookIssueRepository } from "../infrastructure/prisma-book-issue.repository";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { resolveMemberDisplayName } from "./library-member.helpers";
import type { LibraryFineReportRowDTO, MemberActivityDTO, MostBorrowedBookRowDTO } from "./dto/reports.dto";
import type { LibraryMemberTypeValue } from "../domain/book-issue.entity";

// Fine Report — a thin filter over the existing Fee reporting pipeline (reuse Phase 8, per this
// phase's "add only the minimum Fee integration required" instruction): every library fine is
// already a real FeeInvoice row (bookIssueId set), so this just resolves the borrower's name for
// each one.
export async function getLibraryFineReport(tenantId: string, academicSessionId?: string): Promise<LibraryFineReportRowDTO[]> {
  const invoices = await listFeeInvoices(tenantId, { academicSessionId });
  const libraryInvoices = invoices.filter((invoice) => invoice.bookIssueId !== null);

  const studentRepository = new PrismaStudentRepository();
  const rows: LibraryFineReportRowDTO[] = [];
  for (const invoice of libraryInvoices) {
    const student = await studentRepository.findById(tenantId, invoice.studentId);
    rows.push({
      invoiceId: invoice.id,
      bookIssueId: invoice.bookIssueId ?? "",
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
      status: invoice.status,
    });
  }
  return rows;
}

// Most Borrowed Books — issue counts per title in a library, descending.
export async function getMostBorrowedBooksReport(tenantId: string, libraryId: string, limit = 20): Promise<MostBorrowedBookRowDTO[]> {
  const issueRepository = new PrismaBookIssueRepository();
  const copyRepository = new PrismaBookCopyRepository();
  const bookRepository = new PrismaBookRepository();

  const issues = await issueRepository.findByLibrary(tenantId, libraryId);
  const countByBookId = new Map<string, number>();

  for (const issue of issues) {
    const copy = await copyRepository.findById(tenantId, issue.bookCopyId);
    if (!copy) continue;
    countByBookId.set(copy.bookId, (countByBookId.get(copy.bookId) ?? 0) + 1);
  }

  const rows: MostBorrowedBookRowDTO[] = [];
  for (const [bookId, borrowCount] of countByBookId) {
    const book = await bookRepository.findById(tenantId, bookId);
    if (!book) continue;
    rows.push({ bookId, title: book.title, borrowCount });
  }

  rows.sort((a, b) => b.borrowCount - a.borrowCount);
  return rows.slice(0, limit);
}

// Member Activity Report — one member's full circulation summary.
export async function getMemberActivityReport(
  tenantId: string,
  memberType: LibraryMemberTypeValue,
  memberId: string
): Promise<MemberActivityDTO> {
  const issueRepository = new PrismaBookIssueRepository();
  const issues = await issueRepository.findByMember(tenantId, memberType, memberId);
  const memberName = await resolveMemberDisplayName(tenantId, memberType, memberId);
  const today = new Date();

  return {
    memberType,
    memberId,
    memberName,
    totalIssued: issues.length,
    currentlyBorrowed: issues.filter((i) => i.status === "ISSUED").length,
    overdueCount: issues.filter((i) => i.status === "ISSUED" && i.dueDate < today).length,
    lostCount: issues.filter((i) => i.status === "LOST").length,
    damagedCount: issues.filter((i) => i.status === "DAMAGED").length,
  };
}
