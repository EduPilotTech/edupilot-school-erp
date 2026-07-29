export type FineTypeValue = "FLAT" | "PERCENTAGE" | "PER_DAY";

export interface FineRuleEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  feeCategoryId: string | null;
  name: string;
  gracePeriodDays: number;
  fineType: FineTypeValue;
  fineValue: number;
  maxFineAmount: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
