import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError, StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { PrismaFeePaymentRepository } from "../infrastructure/prisma-fee-payment.repository";
import { PrismaFeePaymentAllocationRepository } from "../infrastructure/prisma-fee-payment-allocation.repository";
import { PrismaFeeNumberSequenceRepository } from "../infrastructure/prisma-fee-number-sequence.repository";
import { PrismaFineRuleRepository } from "../infrastructure/prisma-fine-rule.repository";
import { computeFine, resolveFineRule } from "./compute-fine.helpers";
import { computeInvoiceStatus } from "./compute-invoice-status.helpers";
import { appendLedgerEntry } from "./fee-ledger.helpers";
import { recordFeeAudit } from "./fee-audit.helpers";
import { toFeePaymentDTO } from "./fee-payment.mapper";
import { FeeInvoiceNotFoundError, OverpaymentError } from "../domain/errors";
import { collectPaymentSchema } from "./dto/fee-payment.dto";
import type { FeePaymentDTO } from "./dto/fee-payment.dto";
import type { FeeInvoiceStatusValue } from "../domain/fee-invoice.entity";

export interface CollectPaymentContext {
  tenantId: string;
  actingUserId: string;
}

interface PlannedAllocation {
  invoiceId: string;
  amount: number;
  liveFine: number;
  newStatus: FeeInvoiceStatusValue;
  isFirstFineCharge: boolean;
}

// The core transactional financial write of Phase 8 — atomically: increments the RECEIPT
// sequence, creates the immutable FeePayment (Decision 5), allocates it across the selected
// invoices, updates each invoice's amountPaid/status (snapshotting its fine at this exact moment
// — Decision 4), appends a ledger entry per movement (Decision 11), and records an audit log
// entry (Decision 6). All inside one transaction — either the whole collection succeeds or none
// of it does. `clientRequestId`'s `@@unique` constraint is the authoritative double-payment
// guard: a retried/duplicate submit hits P2002 on FeePayment.create and this service returns the
// already-committed payment instead of creating a second one.
export async function collectPayment(input: unknown, context: CollectPaymentContext): Promise<FeePaymentDTO> {
  const parsed = collectPaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid payment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const paymentRepository = new PrismaFeePaymentRepository();
  const allocationRepository = new PrismaFeePaymentAllocationRepository();

  const existingPayment = await paymentRepository.findByClientRequestId(tenantId, data.clientRequestId);
  if (existingPayment) {
    const allocations = await allocationRepository.findByPayment(tenantId, existingPayment.id);
    return toFeePaymentDTO(existingPayment, allocations);
  }

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const invoiceIds = data.allocations.map((allocation) => allocation.invoiceId);
  const invoices = await invoiceRepository.findByIds(tenantId, invoiceIds);
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  const fineRuleRepository = new PrismaFineRuleRepository();
  const fineRules = await fineRuleRepository.findByAcademicSession(tenantId, data.academicSessionId);
  const asOfDate = new Date();

  const plannedAllocations: PlannedAllocation[] = [];
  let totalAmount = 0;

  for (const allocation of data.allocations) {
    const invoice = invoiceById.get(allocation.invoiceId);
    if (!invoice || invoice.studentId !== data.studentId) {
      throw new FeeInvoiceNotFoundError();
    }
    if (invoice.status === "CANCELLED" || invoice.status === "PAID" || invoice.status === "WAIVED") {
      throw new ValidationError(`Invoice ${invoice.invoiceNumber} is not open for payment.`);
    }

    const rule = resolveFineRule(fineRules, invoice.feeCategoryId);
    const liveFine = computeFine({ amount: invoice.amount, dueDate: invoice.dueDate, asOfDate }, rule);
    const netPayable = invoice.amount - invoice.discountAmount + liveFine;
    const balance = Math.round((netPayable - invoice.amountPaid) * 100) / 100;

    if (allocation.amount > balance + 0.01) {
      throw new OverpaymentError();
    }

    const newAmountPaid = Math.round((invoice.amountPaid + allocation.amount) * 100) / 100;
    const newStatus = computeInvoiceStatus({
      amount: invoice.amount,
      discountAmount: invoice.discountAmount,
      fineAmount: liveFine,
      amountPaid: newAmountPaid,
      dueDate: invoice.dueDate,
      asOfDate,
    });

    plannedAllocations.push({
      invoiceId: invoice.id,
      amount: allocation.amount,
      liveFine,
      newStatus,
      isFirstFineCharge: invoice.fineAmount === 0 && liveFine > 0,
    });
    totalAmount += allocation.amount;
  }

  totalAmount = Math.round(totalAmount * 100) / 100;

  const sequenceRepository = new PrismaFeeNumberSequenceRepository();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const receiptNumber = await sequenceRepository.nextNumber(tenantId, data.academicSessionId, "RECEIPT", tx);
      const payment = await paymentRepository.create(
        {
          tenantId,
          studentId: data.studentId,
          academicSessionId: data.academicSessionId,
          receiptNumber,
          clientRequestId: data.clientRequestId,
          amount: totalAmount,
          paymentMode: data.paymentMode,
          collectedBy: actingUserId,
          remarks: data.remarks ?? null,
        },
        tx
      );

      for (const plan of plannedAllocations) {
        if (plan.isFirstFineCharge) {
          await appendLedgerEntry(
            {
              tenantId,
              studentId: data.studentId,
              academicSessionId: data.academicSessionId,
              entryType: "FINE",
              referenceType: "FeeInvoice",
              referenceId: plan.invoiceId,
              debit: plan.liveFine,
              description: "Late fee charged on invoice",
              createdBy: actingUserId,
            },
            tx
          );
        }

        await invoiceRepository.applyPayment(tenantId, plan.invoiceId, plan.amount, plan.liveFine, plan.newStatus, tx);

        await allocationRepository.create(
          { tenantId, paymentId: payment.id, invoiceId: plan.invoiceId, amountAllocated: plan.amount },
          tx
        );

        await appendLedgerEntry(
          {
            tenantId,
            studentId: data.studentId,
            academicSessionId: data.academicSessionId,
            entryType: "PAYMENT",
            referenceType: "FeePayment",
            referenceId: payment.id,
            credit: plan.amount,
            description: `Payment received (receipt ${receiptNumber})`,
            createdBy: actingUserId,
          },
          tx
        );
      }

      await recordFeeAudit(
        {
          tenantId,
          actorId: actingUserId,
          action: "PAYMENT_COLLECTED",
          entityType: "FeePayment",
          entityId: payment.id,
          afterState: { payment, allocations: plannedAllocations },
        },
        tx
      );

      return {
        id: payment.id,
        studentId: payment.studentId,
        academicSessionId: payment.academicSessionId,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentMode: payment.paymentMode,
        status: payment.status,
        paidAt: payment.paidAt.toISOString(),
        collectedBy: payment.collectedBy,
        remarks: payment.remarks,
        reversedAt: null,
        reversalReason: null,
        allocations: plannedAllocations.map((plan) => ({ invoiceId: plan.invoiceId, amountAllocated: plan.amount })),
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await paymentRepository.findByClientRequestId(tenantId, data.clientRequestId);
      if (existing) {
        const allocations = await allocationRepository.findByPayment(tenantId, existing.id);
        return toFeePaymentDTO(existing, allocations);
      }
    }
    throw error;
  }
}
