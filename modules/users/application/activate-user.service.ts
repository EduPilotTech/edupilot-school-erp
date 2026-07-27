import "server-only";
import { statusChangeSchema, type StatusChangeInput } from "./dto/status-change.dto";
import { changeUserStatus } from "./change-status.helper";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface ActivateUserContext {
  tenantId: string;
  actingUserId: string;
}

// No self-action check here, unlike suspend/deactivate: activating yourself carries no
// self-lockout risk (the opposite — it's the recovery direction), and is moot in practice
// since you'd already need to be ACTIVE to call this in the first place.
//
// "Cannot activate deleted user" (Sprint 3 — Step 1 Part F) is enforced by changeUserStatus's
// shared deleted-check, not a separate rule here.
export async function activateUser(
  input: StatusChangeInput,
  context: ActivateUserContext
): Promise<UserServiceResult<UserProfileEntity>> {
  const parsed = statusChangeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  return changeUserStatus(parsed.data.userId, "ACTIVE", context);
}
