export type SalaryPaymentModeValue = "BANK_TRANSFER" | "CASH" | "CHEQUE" | "UPI" | "OTHER";
export type SalaryPaymentStatusValue = "COMPLETED" | "REVERSED" | "CANCELLED";

// The disbursement event — mirrors FeePayment's "this row IS the immutable receipt, status-flip
// not edit" discipline exactly.
export interface SalaryPaymentEntity {
  id: string;
  tenantId: string;
  payslipId: string;
  employeeId: string;
  amount: number;
  paymentMode: SalaryPaymentModeValue;
  paymentDate: Date;
  referenceNumber: string | null;
  status: SalaryPaymentStatusValue;
  reversedAt: Date | null;
  reversedBy: string | null;
  reversalReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
