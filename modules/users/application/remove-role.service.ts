import "server-only";
import { assignRoleSchema, type AssignRoleInput } from "./dto/assign-role.dto";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import { PrismaRoleRepository } from "../infrastructure/prisma-role.repository";
import { PrismaUserRoleRepository } from "../infrastructure/prisma-user-role.repository";
import type { UserServiceResult } from "../domain/types";

export interface RemoveRoleContext {
  tenantId: string;
  actingUserId: string;
}

// Reuses assignRoleSchema/AssignRoleInput — the input shape ({ userId, roleId }) identifying
// which assignment to remove is identical to the one identifying which to create; a distinct
// DTO would just duplicate it field-for-field.
//
// Two distinct, non-redundant protected-role checks (only relevant when role.isProtected):
//   - "Prevent removing your own final administrative role": self-specific — can trigger even
//     when other admins still exist elsewhere in the tenant (e.g. Alice removing her own last
//     admin role while Bob still holds one is still blocked for Alice's own sake).
//   - "Prevent removing the last protected administrator": tenant-wide — triggers regardless of
//     whose role is being removed, if it would leave the tenant with zero active protected-role
//     holders.
export async function removeRole(
  input: AssignRoleInput,
  context: RemoveRoleContext
): Promise<UserServiceResult<null>> {
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

  const userRoleRepository = new PrismaUserRoleRepository();
  const assignment = await userRoleRepository.findByUserAndRole(
    context.tenantId,
    parsed.data.userId,
    parsed.data.roleId
  );

  if (!assignment) {
    return { success: false, error: { code: "NOT_FOUND", message: "This user does not have this role." } };
  }

  const roleRepository = new PrismaRoleRepository();
  const role = await roleRepository.findById(parsed.data.roleId);

  if (role?.isProtected) {
    if (parsed.data.userId === context.actingUserId) {
      const remainingOwnProtected = await userRoleRepository.countUserProtectedRoles(
        context.tenantId,
        parsed.data.userId,
        assignment.id
      );

      if (remainingOwnProtected === 0) {
        return {
          success: false,
          error: {
            code: "SELF_ACTION_NOT_ALLOWED",
            message: "You cannot remove your own last administrative role.",
          },
        };
      }
    }

    const remainingTenantProtected = await userRoleRepository.countActiveProtectedRoleHolders(
      context.tenantId,
      assignment.id
    );

    if (remainingTenantProtected === 0) {
      return {
        success: false,
        error: {
          code: "INVALID_STATE",
          message: "Cannot remove the last protected administrator from this tenant.",
        },
      };
    }
  }

  await userRoleRepository.remove(context.tenantId, assignment.id);

  // TODO(audit): log "Role Changed" (removed) once AuditLog exists (Sprint 3 — Step 1 §8).
  // Needs: actor=context.actingUserId, tenant=context.tenantId, target=parsed.data.userId,
  // role=parsed.data.roleId.

  return { success: true, data: null };
}
