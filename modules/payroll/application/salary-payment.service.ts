import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { notifyEmployee } from "@/modules/hr/application/hr-notification.helpers";
import { PrismaSalaryPaymentRepository } from "../infrastructure/prisma-salary-payment.repository";
import { PrismaPayslipRepository } from "../infrastructure/prisma-payslip.repository";
import { OverpaymentError, PaymentAlreadyReversedError, PayslipNotFoundError, SalaryPaymentNotFoundError } from "../domain/errors";
import { appendPayrollLedgerEntry } from "./payroll-ledger.helpers";
import { recordPayrollAudit } from "./payroll-audit.helpers";
import {
  recordSalaryPaymentSchema,
  reverseSalaryPaymentSchema,
  type SalaryPaymentDTO,
} from "./dto/salary-payment.dto";
import type { SalaryPaymentEntity } from "../domain/salary-payment.entity";
import type { SalaryPaymentListFilter } from "../domain/salary-payment.repository";
import type { PayrollContext } from "./payroll-context";

function toDTO(entity: SalaryPaymentEntity): SalaryPaymentDTO {
  return {
    id: entity.id,
    payslipId: entity.payslipId,
    employeeId: entity.employeeId,
    amount: entity.amount,
    paymentMode: entity.paymentMode,
    paymentDate: entity.paymentDate.toISOString().slice(0, 10),
    referenceNumber: entity.referenceNumber,
    status: entity.status,
    reversedAt: entity.reversedAt ? entity.reversedAt.toISOString() : null,
    reversalReason: entity.reversalReason,
  };
}

const paymentRepository = new PrismaSalaryPaymentRepository();
const payslipRepository = new PrismaPayslipRepository();
const employeeRepository = new PrismaEmployeeRepository();

// The disbursement event — mirrors modules/fees' collect-payment discipline: validates against
// the payslip's own outstanding balance (netPay minus prior COMPLETED payments), never edits an
// existing payment, and settles the payslip to PAID once fully covered. Multiple partial payments
// against one payslip are allowed (not hard-blocked to a single full payment), matching how
// FeePayment allows partial settlement of an invoice.
export async function recordSalaryPayment(input: unknown, context: PayrollContext): Promise<SalaryPaymentDTO> {
  const parsed = recordSalaryPaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid payment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const payslip = await payslipRepository.findById(tenantId, data.payslipId);
  if (!payslip) throw new PayslipNotFoundError();

  const priorPayments = await paymentRepository.findByPayslip(tenantId, payslip.id);
  const alreadyPaid = priorPayments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.round((payslip.netPay - alreadyPaid) * 100) / 100;

  if (data.amount > remaining) {
    throw new OverpaymentError();
  }

  const payment = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const created = await paymentRepository.create(
      {
        tenantId,
        payslipId: payslip.id,
        employeeId: payslip.employeeId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        paymentDate: data.paymentDate,
        referenceNumber: data.referenceNumber ?? null,
        createdBy: actingUserId,
      },
      tx
    );

    const newTotalPaid = Math.round((alreadyPaid + data.amount) * 100) / 100;
    if (newTotalPaid >= payslip.netPay) {
      await payslipRepository.updateStatus(tenantId, payslip.id, "PAID", actingUserId, tx);
    }

    await appendPayrollLedgerEntry(
      {
        tenantId,
        employeeId: payslip.employeeId,
        entryType: "PAYMENT",
        referenceType: "SalaryPayment",
        referenceId: created.id,
        debit: data.amount,
        description: `Salary payment for ${payslip.billingPeriod} (${data.paymentMode})`,
        createdBy: actingUserId,
      },
      tx
    );

    await recordPayrollAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "SALARY_PAYMENT_RECORDED",
        entityType: "SalaryPayment",
        entityId: created.id,
        afterState: created,
      },
      tx
    );

    return created;
  });

  const employee = await employeeRepository.findById(tenantId, payslip.employeeId);
  if (employee) {
    await notifyEmployee(tenantId, employee.userProfileId, {
      title: "Salary Released",
      body: `Your salary of ${data.amount.toFixed(2)} for ${payslip.billingPeriod} has been released via ${data.paymentMode}.`,
      referenceType: "SalaryPayment",
      referenceId: payment.id,
    });
  }

  return toDTO(payment);
}

export async function reverseSalaryPayment(input: unknown, context: PayrollContext): Promise<SalaryPaymentDTO> {
  const parsed = reverseSalaryPaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid reversal request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const payment = await paymentRepository.findById(tenantId, data.paymentId);
  if (!payment) throw new SalaryPaymentNotFoundError();
  if (payment.status === "REVERSED") throw new PaymentAlreadyReversedError();

  const payslip = await payslipRepository.findById(tenantId, payment.payslipId);
  if (!payslip) throw new PayslipNotFoundError();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const reversed = await paymentRepository.reverse(tenantId, payment.id, actingUserId, data.reason, tx);

    if (payslip.status === "PAID") {
      await payslipRepository.updateStatus(tenantId, payslip.id, "GENERATED", actingUserId, tx);
    }

    await appendPayrollLedgerEntry(
      {
        tenantId,
        employeeId: payment.employeeId,
        entryType: "REVERSAL",
        referenceType: "SalaryPayment",
        referenceId: payment.id,
        credit: payment.amount,
        description: `Salary payment reversed: ${data.reason}`,
        createdBy: actingUserId,
      },
      tx
    );

    await recordPayrollAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "SALARY_PAYMENT_REVERSED",
        entityType: "SalaryPayment",
        entityId: payment.id,
        beforeState: payment,
        afterState: reversed,
      },
      tx
    );

    return toDTO(reversed);
  });
}

export async function listSalaryPayments(tenantId: string, filter: SalaryPaymentListFilter): Promise<SalaryPaymentDTO[]> {
  const payments = await paymentRepository.findMany(tenantId, filter);
  return payments.map(toDTO);
}

export { toDTO as toSalaryPaymentDTO };
