// School-wide catalog lookup, shared across every Library branch — mirrors FeeCategory's shape.
export interface BookCategoryEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
