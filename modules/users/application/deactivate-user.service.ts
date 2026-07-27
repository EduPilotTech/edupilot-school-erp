import "server-only";
import { statusChangeSchema, type StatusChangeInput } from "./dto/status-change.dto";
import { changeUserStatus } from "./change-status.helper";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface DeactivateUserContext {
  tenantId: string;
  actingUserId: string;
}

// Same self-lockout reasoning as suspend-user.service.ts — deactivating yourself would leave
// no one able to reverse it from inside the application.
export async function deactivateUser(
  input: StatusChangeInput,
  context: DeactivateUserContext
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
      error: { code: "SELF_ACTION_NOT_ALLOWED", message: "You cannot deactivate your own account." },
    };
  }

  return changeUserStatus(parsed.data.userId, "INACTIVE", context);
}
