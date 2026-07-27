import "server-only";
import { PrismaRoleRepository } from "../infrastructure/prisma-role.repository";
import type { RoleEntity } from "../domain/role.entity";

// Read-only — System Roles plus this tenant's own Custom Roles, for role dropdowns (Invite
// User's initial role, the Assign Role dialog, the Users List role filter).
export async function listAvailableRoles(context: { tenantId: string }): Promise<RoleEntity[]> {
  const repository = new PrismaRoleRepository();
  return repository.findAvailableForTenant(context.tenantId);
}
