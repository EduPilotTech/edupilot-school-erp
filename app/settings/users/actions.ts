"use server";

// Thin Server Actions only — no business logic here. Each action: resolves the caller's
// AuthContext, checks the one permission it requires, then delegates entirely to the
// corresponding modules/users/application service. Calling both requireAuthContext() and
// requirePermission() costs nothing extra: requirePermission() already resolves the same
// underlying AuthContext internally, and both are React cache()-memoized per request — calling
// both here matches the letter of what this step asks for and makes each action's intent
// explicit (who is this, then are they allowed) without any real duplicate work.
//
// Permission codes referenced below (user.invite, user.update, ...) are not yet backed by real
// Permission/RolePermission rows — no seed data exists yet (no migration has run). The code
// correctly references the intended codes; seeding the Permission catalog is a separate,
// future data step, not something this file does.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";
import { inviteUser } from "@/modules/users/application/invite-user.service";
import { acceptInvitation, type AcceptInvitationInput } from "@/modules/users/application/accept-invitation.service";
import { updateUserProfile } from "@/modules/users/application/update-user-profile.service";
import { suspendUser } from "@/modules/users/application/suspend-user.service";
import { activateUser } from "@/modules/users/application/activate-user.service";
import { deactivateUser } from "@/modules/users/application/deactivate-user.service";
import { deleteUser } from "@/modules/users/application/delete-user.service";
import { restoreUser } from "@/modules/users/application/restore-user.service";
import { assignRole } from "@/modules/users/application/assign-role.service";
import { removeRole } from "@/modules/users/application/remove-role.service";
import type { InviteUserInput } from "@/modules/users/application/dto/invite-user.dto";
import type { UpdateUserProfileInput } from "@/modules/users/application/dto/update-user.dto";
import type { StatusChangeInput } from "@/modules/users/application/dto/status-change.dto";
import type { RestoreUserInput } from "@/modules/users/application/dto/restore-user.dto";
import type { AssignRoleInput } from "@/modules/users/application/dto/assign-role.dto";

export async function inviteUserAction(input: InviteUserInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.invite");

  return inviteUser(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

// Deliberately does NOT call requireAuthContext()/requirePermission() — those both resolve
// through requireCurrentUser(), which now rejects anything but an ACTIVE profile (Sprint 3 —
// Step 2, Part A). A user accepting their own invitation is, by definition, still INVITED — the
// one action in this file that must bypass the standard gate, exactly as
// accept-invitation.service.ts's own comment already documents. Uses getSession() only, to
// obtain the Supabase auth user id from the recovery-style session the invite link establishes.
export async function acceptInvitationAction(input: AcceptInvitationInput) {
  const session = await getSession();

  if (!session) {
    return {
      success: false as const,
      error: { code: "NOT_FOUND" as const, message: "We couldn't find your invitation." },
    };
  }

  return acceptInvitation(session.user.id, input);
}

export async function updateUserProfileAction(targetUserId: string, input: UpdateUserProfileInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.update");

  return updateUserProfile(targetUserId, input, {
    tenantId: authContext.tenantId,
    actingUserId: authContext.userId,
  });
}

export async function suspendUserAction(input: StatusChangeInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.suspend");

  return suspendUser(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

export async function activateUserAction(input: StatusChangeInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.activate");

  return activateUser(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

export async function deactivateUserAction(input: StatusChangeInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.deactivate");

  return deactivateUser(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

export async function deleteUserAction(input: StatusChangeInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.delete");

  return deleteUser(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

export async function restoreUserAction(input: RestoreUserInput) {
  const authContext = await requireAuthContext();
  await requirePermission("user.restore");

  return restoreUser(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

export async function assignRoleAction(input: AssignRoleInput) {
  const authContext = await requireAuthContext();
  await requirePermission("role.assign");

  return assignRole(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}

export async function removeRoleAction(input: AssignRoleInput) {
  const authContext = await requireAuthContext();
  await requirePermission("role.remove");

  return removeRole(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
}
