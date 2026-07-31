import type { Prisma } from "@/lib/generated/prisma/client";
import type { SalaryPaymentEntity, SalaryPaymentModeValue } from "./salary-payment.entity";

export interface CreateSalaryPaymentInput {
  tenantId: string;
  payslipId: string;
  employeeId: string;
  amount: number;
  paymentMode: SalaryPaymentModeValue;
  paymentDate: Date;
  referenceNumber?: string | null;
  createdBy?: string | null;
}

export interface SalaryPaymentListFilter {
  employeeId?: string;
  payslipId?: string;
}

// `create`/`reverse` require an already-open `tx` — a SalaryPayment must never be written outside
// the single transaction that also updates the payslip it settles and appends the ledger entry,
// mirroring FeePaymentRepository's own "join the caller's transaction, never open your own"
// discipline.
export interface SalaryPaymentRepository {
  findById(tenantId: string, id: string): Promise<SalaryPaymentEntity | null>;
  findByPayslip(tenantId: string, payslipId: string): Promise<SalaryPaymentEntity[]>;
  findMany(tenantId: string, filter: SalaryPaymentListFilter): Promise<SalaryPaymentEntity[]>;
  create(input: CreateSalaryPaymentInput, tx: Prisma.TransactionClient): Promise<SalaryPaymentEntity>;
  reverse(
    tenantId: string,
    id: string,
    reversedBy: string | null,
    reason: string,
    tx: Prisma.TransactionClient
  ): Promise<SalaryPaymentEntity>;
}
