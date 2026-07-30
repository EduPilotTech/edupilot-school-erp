export type FeeInvoiceStatusValue =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "WAIVED";

// One payable charge for one student, one fee category, one billing period (Phase 8 Decision 3).
// `fineAmount` stays 0 until a payment is collected against this invoice (Decision 4) — never
// trust this column for a still-PENDING/PARTIALLY_PAID invoice; use compute-fine.helpers.ts.
export interface FeeInvoiceEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  feeCategoryId: string;
  // Phase 10 Decision 1 (extended by Phase 11): exactly one of feeStructureItemId (tuition/
  // exam-type invoice), routeFeeRuleId (transport invoice), or hostelFeeRuleId (hostel invoice)
  // is set — enforced at the service layer, not the DB.
  feeStructureItemId: string | null;
  routeFeeRuleId: string | null;
  hostelFeeRuleId: string | null;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  appliedConcessionId: string | null;
  invoiceNumber: string;
  billingPeriod: string;
  amount: number;
  discountAmount: number;
  fineAmount: number;
  amountPaid: number;
  taxAmount: number | null;
  dueDate: Date;
  status: FeeInvoiceStatusValue;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
