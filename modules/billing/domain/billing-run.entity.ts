export type BillingRunStatusValue = "DRAFT" | "PROCESSED" | "LOCKED" | "CANCELLED";

// Platform-ops — no tenantId (spans every tenant on the platform in one operational batch).
// Mirrors PayrollRunEntity's DRAFT->PROCESSED->LOCKED shape, one row per calendar billing period
// across every tenant rather than per-school.
export interface BillingRunEntity {
  id: string;
  billingPeriod: string; // "YYYY-MM"
  status: BillingRunStatusValue;
  processedAt: Date | null;
  processedBy: string | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  totalInvoicesGenerated: number;
  totalAmountBilled: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
