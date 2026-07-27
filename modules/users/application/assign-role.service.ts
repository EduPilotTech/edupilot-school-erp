import "server-only";
import { assignRoleSchema, type AssignRoleInput } from "./dto/assign-role.dto";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import { PrismaRoleRepository } from "../infrastructure/prisma-role.repository";
import { PrismaUserRoleRepository } from "../infrastructure/prisma-user-role.repository";
import type { UserRoleAssignment } from "../domain/user-role.repository";
import type { UserServiceResult } from "../domain/types";

export interface AssignRoleContext {
  tenantId: string;
  actingUserId: string;
}

// "Role must belong to same tenant (for tenant roles); Global roles remain assignable where
// allowed" (Sprint 3 — Step 3 Part A): a Custom Role's tenantId must exactly match the assigning
// tenant; a System Role (tenantId = null) is assignable by any tenant. This is the service-layer
// enforcement of the gap flagged since Sprint 1B — no database constraint covers it, because
// Role.tenantId's nullability rules out the composite-FK trick used elsewhere in this schema
// (see modules/users/infrastructure/prisma-user-role.repository.ts and
// docs/DATABASE_STANDARDS.md).
export async function assignRole(
  input: AssignRoleInput,
  context: AssignRoleContext
): Promise<UserServiceResult<UserRoleAssignment>> {
  const parsed = assignRoleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  const userProfileRepository = new PrismaUserProfileRepository();
  const targetUser = await userProfileRepository.findById(context.tenantId, parsed.data.userId);

  if (!targetUser) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found." } };
  }

  if (targetUser.deletedAt) {
    return {
      success: false,
      error: { code: "INVALID_STATE", message: "This user has been deleted and cannot be modified." },
    };
  }

  const roleRepository = new PrismaRoleRepository();
  const role = await roleRepository.findById(parsed.data.roleId);

  if (!role || role.deletedAt) {
    return { success: false, error: { code: "NOT_FOUND", message: "Role not found." } };
  }

  if (role.tenantId !== null && role.tenantId !== context.tenantId) {
    return {
      success: false,
      error: { code: "CROSS_TENANT", message: "This role does not belong to your school." },
    };
  }

  // Bug found during Sprint 3 — Step 5 review: removeRole already blocks a user from removing
  // their own last protected role, but nothing blocked the mirror-image privilege-escalation
  // case — a user with role.assign granting THEMSELVES a new protected role. Restricted to
  // protected roles specifically, matching removeRole's own scope: self-assigning an ordinary
  // (non-protected) role carries no comparable risk and isn't restricted.
  if (role.isProtected && parsed.data.userId === context.actingUserId) {
    return {
      success: false,
      error: {
        code: "SELF_ACTION_NOT_ALLOWED",
        message: "You cannot assign yourself a protected administrative role.",
      },
    };
  }

  const userRoleRepository = new PrismaUserRoleRepository();
  const existing = await userRoleRepository.findByUserAndRole(
    context.tenantId,
    parsed.data.userId,
    parsed.data.roleId
  );

  if (existing) {
    return {
      success: false,
      error: { code: "INVALID_STATE", message: "This user already has this role." },
    };
  }

  const assignment = await userRoleRepository.create({
    tenantId: context.tenantId,
    userId: parsed.data.userId,
    roleId: parsed.data.roleId,
    createdBy: context.actingUserId,
  });

  // TODO(audit): log "Role Changed" (assigned) once AuditLog exists (Sprint 3 — Step 1 §8).
  // Needs: actor=context.actingUserId, tenant=context.tenantId, target=parsed.data.userId,
  // role=parsed.data.roleId.

  return { success: true, data: assignment };
}
