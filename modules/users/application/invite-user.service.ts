import "server-only";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import { inviteUserByEmail } from "../infrastructure/supabase-invite.adapter";
import { inviteUserSchema, type InviteUserInput } from "./dto/invite-user.dto";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

export interface InviteUserContext {
  tenantId: string;
  actingUserId: string;
}

// Invites a new user: validates input, enforces "no duplicate invitations" and "cannot invite
// deleted user" (Sprint 3 — Step 1 Part F), sends the Supabase invite email, then creates the
// UserProfile row directly (status defaults to INVITED) — there is no separate async sync
// webhook in this codebase yet, so this service performs that step itself, synchronously.
//
// Does NOT pre-assign a Role at invite time, unlike the fuller Step 1 design sketch — no
// assign-role service exists yet this sprint (see dto/assign-role.dto.ts); role assignment at
// invite time is deferred to whichever step builds that service.
export async function inviteUser(
  input: InviteUserInput,
  context: InviteUserContext
): Promise<UserServiceResult<UserProfileEntity>> {
  const parsed = inviteUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Enter a valid email and full name.",
      },
    };
  }

  const repository = new PrismaUserProfileRepository();
  const existing = await repository.findByEmail(context.tenantId, parsed.data.email);

  if (existing?.deletedAt) {
    return {
      success: false,
      error: {
        code: "INVALID_STATE",
        message: "This user has been deleted and cannot be re-invited.",
      },
    };
  }

  if (existing) {
    return {
      success: false,
      error: {
        code: "DUPLICATE_INVITATION",
        message: "This email has already been invited to your school.",
      },
    };
  }

  const inviteResult = await inviteUserByEmail(parsed.data.email, {
    tenant_id: context.tenantId,
    full_name: parsed.data.fullName,
  });

  if (!inviteResult.success) {
    return {
      success: false,
      error: { code: "UNKNOWN_ERROR", message: "Could not send the invitation. Please try again." },
    };
  }

  const userProfile = await repository.create({
    id: inviteResult.data.authUserId,
    tenantId: context.tenantId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    createdBy: context.actingUserId,
  });

  // TODO(audit): log "User Created" and "Invitation Sent" once AuditLog exists
  // (Sprint 3 — Step 1 §8). Needs: actor=context.actingUserId, tenant=context.tenantId,
  // target=userProfile.id.

  return { success: true, data: userProfile };
}
