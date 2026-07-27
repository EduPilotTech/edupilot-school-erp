import "server-only";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import type { UserProfileEntity, UserProfileStatusValue } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

// Shared by suspend-user.service.ts, activate-user.service.ts, and deactivate-user.service.ts
// — not a public "service" of its own, just the tenant-scoped lookup + deleted-check + status
// write these three share identically. Each caller is still responsible for its own self-action
// check (see suspend/deactivate) since that rule differs between them — see the comment in
// activate-user.service.ts for why activate is exempt.
export async function changeUserStatus(
  targetUserId: string,
  newStatus: UserProfileStatusValue,
  context: { tenantId: string; actingUserId: string }
): Promise<UserServiceResult<UserProfileEntity>> {
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

  const updated = await repository.updateStatus(
    context.tenantId,
    targetUserId,
    newStatus,
    context.actingUserId
  );

  // TODO(audit): log "Status Changed" (from=target.status, to=newStatus) once AuditLog exists
  // (Sprint 3 — Step 1 §8). Needs: actor=context.actingUserId, tenant=context.tenantId,
  // target=targetUserId.

  return { success: true, data: updated };
}
