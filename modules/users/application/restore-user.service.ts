import "server-only";
import { restoreUserSchema, type RestoreUserInput } from "./dto/restore-user.dto";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface RestoreUserContext {
  tenantId: string;
  actingUserId: string;
}

// Clears deletedAt only — `status` is left exactly as it was frozen at deletion time, per the
// Sprint 3 — Step 1 lifecycle design (restore is not a reset to a default state).
export async function restoreUser(
  input: RestoreUserInput,
  context: RestoreUserContext
): Promise<UserServiceResult<UserProfileEntity>> {
  const parsed = restoreUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  const repository = new PrismaUserProfileRepository();
  const target = await repository.findById(context.tenantId, parsed.data.userId);

  if (!target) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found." } };
  }

  if (!target.deletedAt) {
    return { success: false, error: { code: "INVALID_STATE", message: "This user is not deleted." } };
  }

  const restored = await repository.restore(context.tenantId, parsed.data.userId, context.actingUserId);

  // TODO(audit): log "Status Changed" (restored) once AuditLog exists (Sprint 3 — Step 1 §8).
  // Needs: actor=context.actingUserId, tenant=context.tenantId, target=parsed.data.userId.

  return { success: true, data: restored };
}
