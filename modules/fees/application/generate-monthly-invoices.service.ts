import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { PrismaFeeStructureRepository } from "../infrastructure/prisma-fee-structure.repository";
import { PrismaFeeStructureItemRepository } from "../infrastructure/prisma-fee-structure-item.repository";
import { PrismaStudentFeeAssignmentRepository } from "../infrastructure/prisma-student-fee-assignment.repository";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { PrismaFeeNumberSequenceRepository } from "../infrastructure/prisma-fee-number-sequence.repository";
import { PrismaFeeConcessionRepository } from "../infrastructure/prisma-fee-concession.repository";
import { resolveConcession, computeDiscountAmount } from "./resolve-concession.helpers";
import { computeMonthlyDueDate } from "./billing-period.helpers";
import { appendLedgerEntry } from "./fee-ledger.helpers";
import { recordFeeAudit } from "./fee-audit.helpers";
import { toFeeInvoiceDTO } from "./fee-invoice.mapper";
import { generateMonthlyInvoicesSchema } from "./dto/fee-invoice.dto";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";

export interface GenerateMonthlyInvoicesContext {
  tenantId: string;
  actingUserId: string;
}

interface PlannedInvoice {
  studentId: string;
  classId: string;
  feeCategoryId: string;
  feeStructureItemId: string;
  amount: number;
  discountAmount: number;
  appliedConcessionId: string | null;
  dueDate: Date;
}

// Generates one FeeInvoice per (student, MONTHLY fee-structure-item) for the given billing
// period, across every FeeStructure in the session — Phase 8 requirement 5 / Decision 9 (bulk
// generation). Idempotent: re-running for a period that already has invoices simply skips
// students/items that already have one, backstopped by the DB's own
// `@@unique([tenantId, studentId, feeStructureItemId, billingPeriod])` (P2002 fallback per
// invoice, never aborting the whole batch). Read/plan phase runs before the write transaction
// opens, mirroring bulk-generate-results.service.ts's own precedent — avoids holding a
// transaction open across many read round-trips.
export async function generateMonthlyInvoices(
  input: unknown,
  context: GenerateMonthlyInvoicesContext
): Promise<FeeInvoiceDTO[]> {
  const parsed = generateMonthlyInvoicesSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid invoice generation request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const structureRepository = new PrismaFeeStructureRepository();
  const itemRepository = new PrismaFeeStructureItemRepository();
  const assignmentRepository = new PrismaStudentFeeAssignmentRepository();
  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const sequenceRepository = new PrismaFeeNumberSequenceRepository();
  const concessionRepository = new PrismaFeeConcessionRepository();

  const structures = await structureRepository.findByAcademicSession(tenantId, data.academicSessionId);
  const planned: PlannedInvoice[] = [];

  for (const structure of structures) {
    const assignments = await assignmentRepository.findByFeeStructure(tenantId, structure.id);
    for (const assignment of assignments) {
      const enrollment = await getCurrentEnrollmentForStudent(assignment.studentId, data.academicSessionId, {
        tenantId,
      });
      if (!enrollment) continue;

      const items = await itemRepository.findByStructureAndClass(tenantId, structure.id, enrollment.classId);
      const monthlyItems = items.filter((item) => item.frequency === "MONTHLY");
      if (monthlyItems.length === 0) continue;

      const concessions = await concessionRepository.findByStudent(
        tenantId,
        assignment.studentId,
        data.academicSessionId
      );

      for (const item of monthlyItems) {
        const existing = await invoiceRepository.findByStudentAndItemAndPeriod(
          tenantId,
          assignment.studentId,
          item.id,
          data.billingPeriod
        );
        if (existing) continue;

        const concession = resolveConcession(concessions, item.feeCategoryId);
        planned.push({
          studentId: assignment.studentId,
          classId: enrollment.classId,
          feeCategoryId: item.feeCategoryId,
          feeStructureItemId: item.id,
          amount: item.amount,
          discountAmount: computeDiscountAmount(item.amount, concession),
          appliedConcessionId: concession?.id ?? null,
          dueDate: computeMonthlyDueDate(data.billingPeriod, item.dueDayOfMonth),
        });
      }
    }
  }

  if (planned.length === 0) return [];

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const created: FeeInvoiceDTO[] = [];

    for (const plan of planned) {
      try {
        const invoiceNumber = await sequenceRepository.nextNumber(tenantId, data.academicSessionId, "INVOICE", tx);
        const invoice = await invoiceRepository.create(
          {
            tenantId,
            studentId: plan.studentId,
            academicSessionId: data.academicSessionId,
            classId: plan.classId,
            feeCategoryId: plan.feeCategoryId,
            feeStructureItemId: plan.feeStructureItemId,
            appliedConcessionId: plan.appliedConcessionId,
            invoiceNumber,
            billingPeriod: data.billingPeriod,
            amount: plan.amount,
            discountAmount: plan.discountAmount,
            dueDate: plan.dueDate,
            createdBy: actingUserId,
          },
          tx
        );

        await appendLedgerEntry(
          {
            tenantId,
            studentId: plan.studentId,
            academicSessionId: data.academicSessionId,
            entryType: "INVOICE",
            referenceType: "FeeInvoice",
            referenceId: invoice.id,
            debit: plan.amount - plan.discountAmount,
            description: `Invoice ${invoice.invoiceNumber} generated for ${data.billingPeriod}`,
            createdBy: actingUserId,
          },
          tx
        );

        await recordFeeAudit(
          {
            tenantId,
            actorId: actingUserId,
            action: "INVOICE_GENERATED",
            entityType: "FeeInvoice",
            entityId: invoice.id,
            afterState: invoice,
          },
          tx
        );

        created.push(toFeeInvoiceDTO(invoice));
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          continue;
        }
        throw error;
      }
    }

    return created;
  });
}
