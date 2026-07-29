// Domain view of FeeCategory — money/percentage fields are plain `number` (converted from
// Prisma's `Decimal` at the infrastructure mapper boundary), matching how Marks/percentage
// fields are represented as `number` elsewhere in this codebase (see modules/examinations).
export interface FeeCategoryEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  isRecurring: boolean;
  hsnSacCode: string | null;
  taxRatePercent: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
