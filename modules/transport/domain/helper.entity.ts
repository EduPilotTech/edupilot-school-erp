// Conductor/attendant. Same nullable-portal shape as Driver (Decision 3).
export interface HelperEntity {
  id: string;
  tenantId: string;
  userProfileId: string | null;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  dateOfJoining: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
