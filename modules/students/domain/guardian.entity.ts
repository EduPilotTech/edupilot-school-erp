// Domain view of Guardian — independent of UserProfile for the same reason as Student
// (parent-portal access is deferred, not part of this sprint).
export interface GuardianEntity {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
