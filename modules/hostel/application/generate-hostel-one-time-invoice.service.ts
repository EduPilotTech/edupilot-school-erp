import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { StudentNotEnrolledInSessionError, StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { PrismaFeeInvoiceRepository } from "@/modules/fees/infrastructure/prisma-fee-invoice.repository";
import { PrismaFeeNumberSequenceRepository } from "@/modules/fees/infrastructure/prisma-fee-number-sequence.repository";
import { appendLedgerEntry } from "@/modules/fees/application/fee-ledger.helpers";
import { recordFeeAudit } from "@/modules/fees/application/fee-audit.helpers";
import { toFeeInvoiceDTO } from "@/modules/fees/application/fee-invoice.mapper";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";
import { PrismaHostelFeeRuleRepository } from "../infrastructure/prisma-hostel-fee-rule.repository";
import { HostelFeeRuleNotFoundError, InvoiceAlreadyGeneratedFromRuleError } from "../domain/errors";
import { generateHostelOneTimeInvoiceSchema } from "./dto/hostel-fee-rule.dto";

export interface GenerateHostelOneTimeInvoiceContext {
  tenantId: string;
  actingUserId: string;
}

// One-time hostel charges (Security Deposit, Fine — both ONE_TIME frequency HostelFeeRules)
// reuse the same FeeInvoice pipeline as monthly hostel fees, distinguished only by
// `billingPeriod` being a fixed label rather than a "YYYY-MM" string — mirrors Phase 8's own
// generate-one-time-invoice.service.ts exactly, keyed by HostelFeeRule instead of
// FeeStructureItem.
const ONE_TIME_BILLING_PERIOD = "ONE_TIME";

export async function generateHostelOneTimeInvoice(
  input: unknown,
  context: GenerateHostelOneTimeInvoiceContext
): Promise<FeeInvoiceDTO> {
  const parsed = generateHostelOneTimeInvoiceSchema.safeParse(input);
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

  const ruleRepository = new PrismaHostelFeeRuleRepository();
  const rule = await ruleRepository.findById(tenantId, data.hostelFeeRuleId);
  if (!rule || rule.deletedAt !== null) {
    throw new HostelFeeRuleNotFoundError();
  }
  if (rule.frequency !== "ONE_TIME") {
    throw new ValidationError("This hostel fee rule is not a one-time fee.");
  }

  const enrollment = await getCurrentEnrollmentForStudent(data.studentId, rule.academicSessionId, { tenantId });
  if (!enrollment) {
    throw new StudentNotEnrolledInSessionError();
  }

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const existing = await invoiceRepository.findByStudentAndHostelFeeRuleAndPeriod(
    tenantId,
    data.studentId,
    rule.id,
    ONE_TIME_BILLING_PERIOD
  );
  if (existing) {
    throw new InvoiceAlreadyGeneratedFromRuleError();
  }

  const sequenceRepository = new PrismaFeeNumberSequenceRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const invoiceNumber = await sequenceRepository.nextNumber(tenantId, rule.academicSessionId, "INVOICE", tx);
    const invoice = await invoiceRepository.create(
      {
        tenantId,
        studentId: data.studentId,
        academicSessionId: rule.academicSessionId,
        classId: enrollment.classId,
        feeCategoryId: rule.feeCategoryId,
        hostelFeeRuleId: rule.id,
        invoiceNumber,
        billingPeriod: ONE_TIME_BILLING_PERIOD,
        amount: rule.amount,
        dueDate: new Date(),
        createdBy: actingUserId,
      },
      tx
    );

    await appendLedgerEntry(
      {
        tenantId,
        studentId: data.studentId,
        academicSessionId: rule.academicSessionId,
        entryType: "INVOICE",
        referenceType: "FeeInvoice",
        referenceId: invoice.id,
        debit: rule.amount,
        description: `One-time hostel invoice ${invoice.invoiceNumber} generated`,
        createdBy: actingUserId,
      },
      tx
    );

    await recordFeeAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "HOSTEL_INVOICE_GENERATED",
        entityType: "FeeInvoice",
        entityId: invoice.id,
        afterState: invoice,
      },
      tx
    );

    return toFeeInvoiceDTO(invoice);
  });
}
