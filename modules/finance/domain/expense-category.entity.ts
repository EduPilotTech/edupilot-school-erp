// School-wide lookup for categorizing Expense entries (e.g. "Salaries", "Utilities",
// "Maintenance") — mirrors BookCategory/Department's own lookup-table shape.
export interface ExpenseCategoryEntity {
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
