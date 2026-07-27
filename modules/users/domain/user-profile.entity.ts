// Domain entity for UserProfile — deliberately decoupled from Prisma's generated type, per
// docs/PROJECT_ARCHITECTURE.md's Clean Architecture rule that the domain layer has zero
// imports from Prisma. `UserProfileStatusValue` is defined here as its own string union
// (identical runtime values to the Prisma enum) rather than imported, for the same reason —
// the infrastructure layer (modules/users/infrastructure) maps between the two.

export type UserProfileStatusValue = "INVITED" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface UserProfileEntity {
  id: string;
  tenantId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: UserProfileStatusValue;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
