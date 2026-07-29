export interface FeeStructureEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export type FeeFrequencyValue =
  | "ONE_TIME"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "ANNUAL"
  | "INSTALLMENT";

// The class-wise amount for one fee category within a FeeStructure — see the schema comment on
// FeeStructureItem for why `classId` is always set (never a nullable "all classes" wildcard).
export interface FeeStructureItemEntity {
  id: string;
  tenantId: string;
  feeStructureId: string;
  classId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  dueDayOfMonth: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
