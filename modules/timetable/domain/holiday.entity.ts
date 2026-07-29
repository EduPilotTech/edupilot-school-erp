export interface HolidayEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  date: Date;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
