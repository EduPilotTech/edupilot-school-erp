// Phase 13 — the HR canonical entity. A 1:1 extension of UserProfile, mirroring TeacherEntity's
// own precedent exactly: deliberately does NOT duplicate `fullName`/`email`/`phone`/`avatarUrl`
// — those stay on UserProfile, the single identity record; this entity only carries
// HR-specific metadata. Callers that need an employee's name/contact info join through
// `userProfileId`.
export type EmploymentStatusValue =
  | "ACTIVE"
  | "ON_PROBATION"
  | "ON_LEAVE"
  | "SUSPENDED"
  | "RESIGNED"
  | "TERMINATED"
  | "RETIRED";

export interface EmployeeEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  userProfileId: string;
  departmentId: string;
  designationId: string;
  employmentTypeId: string;
  reportingManagerId: string | null;
  employeeCode: string;
  joiningDate: Date;
  confirmationDate: Date | null;
  employmentStatus: EmploymentStatusValue;
  qualification: string | null;
  experienceYears: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
