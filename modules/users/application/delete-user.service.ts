import "server-only";
import { statusChangeSchema, type StatusChangeInput } from "./dto/status-change.dto";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface DeleteUserContext {
  tenantId: string;
  actingUserId: string;
}

// Soft delete only — sets deletedAt, never a real SQL DELETE, per docs/DATABASE_STANDARDS.md's
// no-hard-delete policy. Reuses statusChangeSchema (Sprint 3 — Step 1 Part D groups this with
// the status-change inputs, since the input shape — { userId, reason? } — is identical; a
// distinct delete-user.dto.ts would just duplicate it field-for-field.
//
// "Cannot delete yourself" (Part F) — same self-lockout reasoning as suspend/deactivate.
export async function deleteUser(
  input: StatusChangeInput,
  context: DeleteUserContext
): Promise<UserServiceResult<UserProfileEntity>> {
  const parsed = statusChangeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  if (parsed.data.userId === context.actingUserId) {
    return {
      success: false,
      error: { code: "SELF_ACTION_NOT_ALLOWED", message: "You cannot delete your own account." },
    };
  }

  const repository = new PrismaUserProfileRepository();
  const target = await repository.findById(context.tenantId, parsed.data.userId);

  if (!target) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found." } };
  }

  if (target.deletedAt) {
    return {
      success: false,
      error: { code: "INVALID_STATE", message: "This user has already been deleted." },
    };
  }

  const deleted = await repository.softDelete(context.tenantId, parsed.data.userId, context.actingUserId);

  // TODO(audit): log "Status Changed" (soft delete) once AuditLog exists (Sprint 3 — Step 1 §8).
  // Needs: actor=context.actingUserId, tenant=context.tenantId, target=parsed.data.userId,
  // reason=parsed.data.reason.

  return { success: true, data: deleted };
}
