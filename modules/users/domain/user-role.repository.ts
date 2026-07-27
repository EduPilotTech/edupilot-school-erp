// Repository interface for UserRole assignments — separate from UserProfileRepository since
// role assignment is its own concern. Every method takes `tenantId` explicitly, same rule as
// UserProfileRepository (docs/CODING_STANDARDS.md §6).

export interface UserRoleAssignment {
  id: string;
  tenantId: string;
  userId: string;
  roleId: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface CreateUserRoleInput {
  tenantId: string;
  userId: string;
  roleId: string;
  createdBy?: string | null;
}

// Added in Sprint 3 — Step 4 for the User Details page, which needs to display a user's roles
// by name, not just by id.
export interface UserRoleAssignmentWithRole extends UserRoleAssignment {
  roleName: string;
  roleCode: string | null;
  roleIsProtected: boolean;
}

export interface UserRoleRepository {
  findByUserAndRole(tenantId: string, userId: string, roleId: string): Promise<UserRoleAssignment | null>;

  listForUser(tenantId: string, userId: string): Promise<UserRoleAssignmentWithRole[]>;

  // How many distinct, active (ACTIVE status, not soft-deleted) users in this tenant currently
  // hold at least one protected role, optionally excluding one specific assignment (the one a
  // caller is considering removing) — backs the "last protected administrator" rule.
  countActiveProtectedRoleHolders(tenantId: string, excludingId?: string): Promise<number>;

  // How many protected-role assignments a specific user holds, optionally excluding one
  // specific assignment — backs "cannot remove your own final administrative role" (a
  // narrower, self-specific rule distinct from the tenant-wide floor above: it can trigger even
  // when other admins still exist elsewhere in the tenant).
  countUserProtectedRoles(tenantId: string, userId: string, excludingId?: string): Promise<number>;

  create(input: CreateUserRoleInput): Promise<UserRoleAssignment>;
  remove(tenantId: string, id: string): Promise<void>;
}
