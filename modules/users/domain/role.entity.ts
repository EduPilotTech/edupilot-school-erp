// Minimal domain view of Role — only the fields modules/users needs to decide assignability
// (tenant match, protection, soft-delete). Deliberately decoupled from Prisma's generated type,
// same reasoning as user-profile.entity.ts.

export type RoleScopeValue = "SYSTEM" | "CUSTOM";

export interface RoleEntity {
  id: string;
  tenantId: string | null;
  scope: RoleScopeValue;
  isProtected: boolean;
  name: string;
  code: string | null;
  deletedAt: Date | null;
}
