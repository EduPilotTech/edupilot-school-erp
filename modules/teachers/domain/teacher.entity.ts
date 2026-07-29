// Domain view of Teacher — a 1:1 extension of UserProfile (Phase 6 architecture review's
// Decision 1). Deliberately does NOT duplicate `fullName`/`email`/`phone`/`avatarUrl` — those
// stay on UserProfile, the single identity record; this entity only carries teaching-specific
// metadata. Callers that need a teacher's name/contact info join through `userProfileId`.
export interface TeacherEntity {
  id: string;
  tenantId: string;
  userProfileId: string;
  employeeCode: string;
  joiningDate: Date;
  qualification: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
