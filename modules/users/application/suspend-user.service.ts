import "server-only";
import { statusChangeSchema, type StatusChangeInput } from "./dto/status-change.dto";
import { changeUserStatus } from "./change-status.helper";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface SuspendUserContext {
  tenantId: string;
  actingUserId: string;
}

// "Cannot suspend yourself" (Sprint 3 — Step 1 Part F) — suspending yourself would lock you out
// with no one able to reverse it from inside the application.
export async function suspendUser(
  input: StatusChangeInput,
  context: SuspendUserContext
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
      error: { code: "SELF_ACTION_NOT_ALLOWED", message: "You cannot suspend your own account." },
    };
  }

  return changeUserStatus(parsed.data.userId, "SUSPENDED", context);
}
