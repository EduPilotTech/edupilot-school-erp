import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeePaymentEntity, FeePaymentModeValue } from "./fee-payment.entity";

export interface CreateFeePaymentInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  receiptNumber: string;
  clientRequestId: string;
  amount: number;
  paymentMode: FeePaymentModeValue;
  collectedBy?: string | null;
  remarks?: string | null;
}

// `create`/`reverse` require an already-open `tx` (not optional) — a FeePayment must never be
// written outside the single transaction that also generates its receipt number, inserts its
// allocations, and updates the invoices it settles (see collect-payment.service.ts /
// reverse-payment.service.ts). This is the same "join the caller's transaction, never open your
// own" discipline as FeeNumberSequenceRepository.nextNumber.
export interface FeePaymentRepository {
  findById(tenantId: string, id: string): Promise<FeePaymentEntity | null>;
  findByClientRequestId(tenantId: string, clientRequestId: string): Promise<FeePaymentEntity | null>;
  findByStudent(tenantId: string, studentId: string, academicSessionId: string): Promise<FeePaymentEntity[]>;
  findByDateRange(
    tenantId: string,
    academicSessionId: string,
    from: Date,
    to: Date
  ): Promise<FeePaymentEntity[]>;

  create(input: CreateFeePaymentInput, tx: Prisma.TransactionClient): Promise<FeePaymentEntity>;

  reverse(
    tenantId: string,
    id: string,
    reversedBy: string | null,
    reason: string,
    tx: Prisma.TransactionClient
  ): Promise<FeePaymentEntity>;
}
