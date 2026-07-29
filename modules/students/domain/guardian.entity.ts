// Domain view of Guardian — independent of UserProfile at its core (a Guardian can be a pure
// contact record with no portal access). `userProfileId` (Phase 9 Decision 1) is the additive,
// nullable Parent Account link — most Guardians never get one.
export interface GuardianEntity {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  userProfileId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
