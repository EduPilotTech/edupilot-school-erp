// School-scoped, session-independent master data — a physical library branch. Multiple rows per
// school are explicitly supported (requirement 1).
export interface LibraryEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
