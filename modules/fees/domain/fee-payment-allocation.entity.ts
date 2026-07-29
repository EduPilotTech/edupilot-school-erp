export interface FeePaymentAllocationEntity {
  id: string;
  tenantId: string;
  paymentId: string;
  invoiceId: string;
  amountAllocated: number;
  createdAt: Date;
}
