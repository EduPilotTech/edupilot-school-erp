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
import { PrismaInstallmentPlanRepository } from "../infrastructure/prisma-installment-plan.repository";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { PrismaFeeNumberSequenceRepository } from "../infrastructure/prisma-fee-number-sequence.repository";
import { PrismaFeeConcessionRepository } from "../infrastructure/prisma-fee-concession.repository";
import { resolveConcession, computeDiscountAmount } from "./resolve-concession.helpers";
import { computeInstallmentDueDate } from "./billing-period.helpers";
import { appendLedgerEntry } from "./fee-ledger.helpers";
import { recordFeeAudit } from "./fee-audit.helpers";
import { toFeeInvoiceDTO } from "./fee-invoice.mapper";
import { FeeStructureItemNotFoundError, FeeStructureNotFoundError } from "../domain/errors";
import { generateInstallmentInvoicesSchema } from "./dto/fee-invoice.dto";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";

export interface GenerateInstallmentInvoicesContext {
  tenantId: string;
  actingUserId: string;
}

interface PlannedInstallment {
  studentId: string;
  classId: string;
  installmentPlanId: string;
  installmentNumber: number;
  billingPeriod: string;
  amount: number;
  discountAmount: number;
  appliedConcessionId: string | null;
  dueDate: Date;
}

// Generates one FeeInvoice per InstallmentPlanItem for every student assigned to an INSTALLMENT
// FeeStructureItem who has opted into an InstallmentPlan on their StudentFeeAssignment — students
// with no installmentPlanId set are skipped (they are expected to pay that item as a lump sum
// via a different item/frequency instead). `billingPeriod` is `INSTALLMENT-<n>`, distinct from
// both the "YYYY-MM" monthly format and the fixed "ONE_TIME" label.
export async function generateInstallmentInvoices(
  input: unknown,
  context: GenerateInstallmentInvoicesContext
): Promise<FeeInvoiceDTO[]> {
  const parsed = generateInstallmentInvoicesSchema.safeParse(input);
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

  const itemRepository = new PrismaFeeStructureItemRepository();
  const item = await itemRepository.findById(tenantId, data.feeStructureItemId);
  if (!item || item.deletedAt !== null) {
    throw new FeeStructureItemNotFoundError();
  }
  if (item.frequency !== "INSTALLMENT") {
    throw new ValidationError("This fee structure item is not installment-based.");
  }

  const structureRepository = new PrismaFeeStructureRepository();
  const structure = await structureRepository.findById(tenantId, item.feeStructureId);
  if (!structure || structure.deletedAt !== null) {
    throw new FeeStructureNotFoundError();
  }

  const assignmentRepository = new PrismaStudentFeeAssignmentRepository();
  const planRepository = new PrismaInstallmentPlanRepository();
  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const sequenceRepository = new PrismaFeeNumberSequenceRepository();
  const concessionRepository = new PrismaFeeConcessionRepository();

  const assignments = await assignmentRepository.findByFeeStructure(tenantId, structure.id);
  const planned: PlannedInstallment[] = [];

  for (const assignment of assignments) {
    if (!assignment.installmentPlanId) continue;

    const enrollment = await getCurrentEnrollmentForStudent(assignment.studentId, data.academicSessionId, {
      tenantId,
    });
    if (!enrollment || enrollment.classId !== item.classId) continue;

    const planItems = await planRepository.findItemsByPlan(tenantId, assignment.installmentPlanId);
    if (planItems.length === 0) continue;

    const concessions = await concessionRepository.findByStudent(
      tenantId,
      assignment.studentId,
      data.academicSessionId
    );
    const concession = resolveConcession(concessions, item.feeCategoryId);

    for (const planItem of planItems) {
      const installmentAmount = Math.round(((item.amount * planItem.percentageOfTotal) / 100) * 100) / 100;
      const billingPeriod = `INSTALLMENT-${planItem.installmentNumber}`;
      const existing = await invoiceRepository.findByStudentAndItemAndPeriod(
        tenantId,
        assignment.studentId,
        item.id,
        billingPeriod
      );
      if (existing) continue;

      planned.push({
        studentId: assignment.studentId,
        classId: enrollment.classId,
        installmentPlanId: assignment.installmentPlanId,
        installmentNumber: planItem.installmentNumber,
        billingPeriod,
        amount: installmentAmount,
        discountAmount: computeDiscountAmount(installmentAmount, concession),
        appliedConcessionId: concession?.id ?? null,
        dueDate: computeInstallmentDueDate(session.startDate, planItem.dueDayOffset),
      });
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
            feeCategoryId: item.feeCategoryId,
            feeStructureItemId: item.id,
            installmentPlanId: plan.installmentPlanId,
            installmentNumber: plan.installmentNumber,
            appliedConcessionId: plan.appliedConcessionId,
            invoiceNumber,
            billingPeriod: plan.billingPeriod,
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
            description: `Installment ${plan.installmentNumber} invoice ${invoice.invoiceNumber} generated`,
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
