import type { RoleEntity } from "./role.entity";

export interface RoleRepository {
  findById(id: string): Promise<RoleEntity | null>;

  // Every non-deleted role a tenant may assign: System Roles (tenantId = null) plus this
  // tenant's own Custom Roles. Added in Sprint 3 — Step 4 for role dropdowns (Invite User's
  // initial role, the Assign Role dialog, the Users List role filter) — nothing needed a "list"
  // query before this, only findById.
  findAvailableForTenant(tenantId: string): Promise<RoleEntity[]>;
}
