import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { StudentNotEnrolledInSessionError, StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { PrismaFeeStructureRepository } from "../infrastructure/prisma-fee-structure.repository";
import { PrismaFeeStructureItemRepository } from "../infrastructure/prisma-fee-structure-item.repository";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { PrismaFeeNumberSequenceRepository } from "../infrastructure/prisma-fee-number-sequence.repository";
import { PrismaFeeConcessionRepository } from "../infrastructure/prisma-fee-concession.repository";
import { resolveConcession, computeDiscountAmount } from "./resolve-concession.helpers";
import { appendLedgerEntry } from "./fee-ledger.helpers";
import { recordFeeAudit } from "./fee-audit.helpers";
import { toFeeInvoiceDTO } from "./fee-invoice.mapper";
import {
  FeeStructureItemNotFoundError,
  FeeStructureNotFoundError,
  InvoiceAlreadyGeneratedError,
} from "../domain/errors";
import { generateOneTimeInvoiceSchema } from "./dto/fee-invoice.dto";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";

export interface GenerateOneTimeInvoiceContext {
  tenantId: string;
  actingUserId: string;
}

// One-time fees (admission, registration, ID card — requirement 9) reuse the same FeeInvoice
// pipeline as monthly fees, distinguished only by `billingPeriod` being a fixed label rather than
// a "YYYY-MM" string — that fixed label is what makes the natural-key unique constraint enforce
// "only ever one invoice for this student+item" for a one-time charge.
const ONE_TIME_BILLING_PERIOD = "ONE_TIME";

export async function generateOneTimeInvoice(
  input: unknown,
  context: GenerateOneTimeInvoiceContext
): Promise<FeeInvoiceDTO> {
  const parsed = generateOneTimeInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid invoice generation request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const itemRepository = new PrismaFeeStructureItemRepository();
  const item = await itemRepository.findById(tenantId, data.feeStructureItemId);
  if (!item || item.deletedAt !== null) {
    throw new FeeStructureItemNotFoundError();
  }
  if (item.frequency !== "ONE_TIME") {
    throw new ValidationError("This fee structure item is not a one-time fee.");
  }

  const structureRepository = new PrismaFeeStructureRepository();
  const structure = await structureRepository.findById(tenantId, item.feeStructureId);
  if (!structure || structure.deletedAt !== null) {
    throw new FeeStructureNotFoundError();
  }

  const enrollment = await getCurrentEnrollmentForStudent(data.studentId, structure.academicSessionId, {
    tenantId,
  });
  if (!enrollment) {
    throw new StudentNotEnrolledInSessionError();
  }

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const existing = await invoiceRepository.findByStudentAndItemAndPeriod(
    tenantId,
    data.studentId,
    item.id,
    ONE_TIME_BILLING_PERIOD
  );
  if (existing) {
    throw new InvoiceAlreadyGeneratedError();
  }

  const concessionRepository = new PrismaFeeConcessionRepository();
  const concessions = await concessionRepository.findByStudent(tenantId, data.studentId, structure.academicSessionId);
  const concession = resolveConcession(concessions, item.feeCategoryId);
  const discountAmount = computeDiscountAmount(item.amount, concession);

  const sequenceRepository = new PrismaFeeNumberSequenceRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const invoiceNumber = await sequenceRepository.nextNumber(tenantId, structure.academicSessionId, "INVOICE", tx);
    const invoice = await invoiceRepository.create(
      {
        tenantId,
        studentId: data.studentId,
        academicSessionId: structure.academicSessionId,
        classId: enrollment.classId,
        feeCategoryId: item.feeCategoryId,
        feeStructureItemId: item.id,
        appliedConcessionId: concession?.id ?? null,
        invoiceNumber,
        billingPeriod: ONE_TIME_BILLING_PERIOD,
        amount: item.amount,
        discountAmount,
        dueDate: new Date(),
        createdBy: actingUserId,
      },
      tx
    );

    await appendLedgerEntry(
      {
        tenantId,
        studentId: data.studentId,
        academicSessionId: structure.academicSessionId,
        entryType: "INVOICE",
        referenceType: "FeeInvoice",
        referenceId: invoice.id,
        debit: item.amount - discountAmount,
        description: `One-time invoice ${invoice.invoiceNumber} generated`,
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

    return toFeeInvoiceDTO(invoice);
  });
}
