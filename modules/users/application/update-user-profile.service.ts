import "server-only";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import { updateUserProfileSchema, type UpdateUserProfileInput } from "./dto/update-user.dto";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface UpdateUserProfileContext {
  tenantId: string;
  actingUserId: string;
}

// `findById(context.tenantId, targetUserId)` is what enforces "no cross-tenant operations"
// here: it's scoped to context.tenantId (derived from the caller's own resolved AuthContext,
// never from request input), so a targetUserId belonging to a different tenant simply resolves
// to null — the operation fails closed as NOT_FOUND rather than needing a separate explicit
// cross-tenant check.
export async function updateUserProfile(
  targetUserId: string,
  input: UpdateUserProfileInput,
  context: UpdateUserProfileContext
): Promise<UserServiceResult<UserProfileEntity>> {
  const parsed = updateUserProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
    };
  }

  const repository = new PrismaUserProfileRepository();
  const target = await repository.findById(context.tenantId, targetUserId);

  if (!target) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found." } };
  }

  if (target.deletedAt) {
    return {
      success: false,
      error: { code: "INVALID_STATE", message: "This user has been deleted and cannot be modified." },
    };
  }

  const updated = await repository.update(context.tenantId, targetUserId, {
    ...parsed.data,
    updatedBy: context.actingUserId,
  });

  // TODO(audit): log "User Updated" once AuditLog exists (Sprint 3 — Step 1 §8).
  // Needs: actor=context.actingUserId, tenant=context.tenantId, target=targetUserId, diff=parsed.data.

  return { success: true, data: updated };
}
