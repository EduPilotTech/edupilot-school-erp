export interface SectionEntity {
  id: string;
  tenantId: string;
  classId: string;
  name: string;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
