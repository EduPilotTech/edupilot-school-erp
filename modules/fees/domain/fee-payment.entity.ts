export type FeePaymentModeValue = "CASH" | "CHEQUE" | "UPI" | "CARD" | "BANK_TRANSFER" | "ONLINE";
export type FeePaymentStatusValue = "COMPLETED" | "REVERSED" | "CANCELLED";

// A single cash-collection event — this row IS the immutable receipt (Phase 8 Decision 5). Once
// `status = COMPLETED`, only the reversal fields are ever written again (Decision 10 — status
// flip, never a value edit). Gateway fields are always null/unused this phase — reserved only.
export interface FeePaymentEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  receiptNumber: string;
  clientRequestId: string;
  amount: number;
  paymentMode: FeePaymentModeValue;
  status: FeePaymentStatusValue;
  paidAt: Date;
  collectedBy: string | null;
  remarks: string | null;
  gatewayProvider: string | null;
  gatewayTransactionId: string | null;
  gatewayOrderId: string | null;
  reversedAt: Date | null;
  reversedBy: string | null;
  reversalReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
