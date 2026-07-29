export type FeeConcessionTypeValue =
  | "DISCOUNT"
  | "SCHOLARSHIP"
  | "CONCESSION"
  | "WAIVER"
  | "SIBLING"
  | "STAFF_WARD"
  | "OTHER";

export type FeeConcessionValueTypeValue = "PERCENTAGE" | "FIXED_AMOUNT";

// Unifies Discount, Scholarship, Concession, and Waiver (Phase 8 Decision 2) — `type` carries the
// reason (for reporting), `valueType`/`value` carry the mechanics. A full waiver is simply
// `valueType=PERCENTAGE, value=100`, not a separate code path.
export interface FeeConcessionEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  feeCategoryId: string | null;
  type: FeeConcessionTypeValue;
  valueType: FeeConcessionValueTypeValue;
  value: number;
  reason: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
