// Decision 3: userProfileId is nullable — a Driver can exist purely as a records-management
// entity with no portal login, mirroring Guardian's own precedent (as opposed to Teacher's
// mandatory userProfileId, since every Teacher onboarding flow creates a login).
export interface DriverEntity {
  id: string;
  tenantId: string;
  userProfileId: string | null;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  licenseNumber: string;
  licenseType: string | null;
  licenseExpiryDate: Date | null;
  dateOfJoining: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
