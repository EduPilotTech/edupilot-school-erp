export interface AuthorEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  biography: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
