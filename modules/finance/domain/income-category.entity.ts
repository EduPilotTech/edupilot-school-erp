// School-wide lookup for categorizing Income entries (e.g. "Tuition Fee", "Donation", "Rental
// Income") — mirrors BookCategory/Department's own lookup-table shape.
export interface IncomeCategoryEntity {
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
