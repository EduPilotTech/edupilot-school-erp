import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeePaymentAllocationEntity } from "./fee-payment-allocation.entity";

export interface CreateFeePaymentAllocationInput {
  tenantId: string;
  paymentId: string;
  invoiceId: string;
  amountAllocated: number;
}

export interface FeePaymentAllocationRepository {
  findByPayment(tenantId: string, paymentId: string): Promise<FeePaymentAllocationEntity[]>;
  findByInvoice(tenantId: string, invoiceId: string): Promise<FeePaymentAllocationEntity[]>;
  create(input: CreateFeePaymentAllocationInput, tx: Prisma.TransactionClient): Promise<FeePaymentAllocationEntity>;
}
