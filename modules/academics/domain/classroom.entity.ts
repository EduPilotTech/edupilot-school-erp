export interface ClassroomEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  capacity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
