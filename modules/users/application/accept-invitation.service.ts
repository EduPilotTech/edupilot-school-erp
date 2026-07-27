import "server-only";
import { z } from "zod";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserServiceResult } from "../domain/types";

// Deliberately does NOT use lib/auth/current-user.ts's requireCurrentUser() — that function
// now rejects anything but an ACTIVE profile (Part A of this sprint), and an invited user
// completing their own invitation is, by definition, still INVITED. This service resolves the
// profile directly by the Supabase auth user id instead, the same self-access-by-primary-key
// pattern already used by getCurrentUser() and findByAuthUserId().

const acceptInvitationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(200, "Full name is too long.").optional(),
  phone: z.string().trim().max(30, "Phone number is too long.").optional(),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// Completes an invitation: optionally updates the profile fields the admin didn't already
// provide, then transitions INVITED -> ACTIVE. `authUserId` is the id of the session Supabase
// establishes when the user clicks their invite link — it must come from that session, never
// from client-submitted form data.
export async function acceptInvitation(
  authUserId: string,
  input: AcceptInvitationInput
): Promise<UserServiceResult<UserProfileEntity>> {
  const parsed = acceptInvitationSchema.safeParse(input);

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
  const userProfile = await repository.findByAuthUserId(authUserId);

  if (!userProfile) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "We couldn't find your invitation." },
    };
  }

  if (userProfile.deletedAt) {
    return {
      success: false,
      error: { code: "INVALID_STATE", message: "This invitation is no longer valid." },
    };
  }

  if (userProfile.status !== "INVITED") {
    return {
      success: false,
      error: { code: "INVALID_STATE", message: "This invitation has already been used." },
    };
  }

  if (parsed.data.fullName || parsed.data.phone) {
    await repository.update(userProfile.tenantId, userProfile.id, {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      updatedBy: userProfile.id,
    });
  }

  const activated = await repository.updateStatus(
    userProfile.tenantId,
    userProfile.id,
    "ACTIVE",
    userProfile.id
  );

  // TODO(audit): log "Invitation Accepted" once AuditLog exists (Sprint 3 — Step 1 §8).
  // Needs: actor=userProfile.id, tenant=userProfile.tenantId, target=userProfile.id.

  return { success: true, data: activated };
}
