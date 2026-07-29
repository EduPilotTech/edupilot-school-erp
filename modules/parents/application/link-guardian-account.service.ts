import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import { PrismaRoleRepository } from "@/modules/users/infrastructure/prisma-role.repository";
import { assignRole } from "@/modules/users/application/assign-role.service";
import { inviteUserByEmail } from "@/modules/users/infrastructure/supabase-invite.adapter";
import { GuardianAlreadyLinkedError, GuardianNotFoundError } from "../domain/errors";
import { linkGuardianAccountSchema } from "./dto/link-guardian-account.dto";
import type { GuardianEntity } from "@/modules/students/domain/guardian.entity";

export interface LinkGuardianAccountContext {
  tenantId: string;
  actingUserId: string;
}

const PARENT_ROLE_CODE = "PARENT";

// Parent Account (requirement 1) / Parent Authentication (requirement 2) — reuses the exact same
// primitives invite-user.service.ts does (Supabase invite email -> UserProfile row -> role
// assignment), just scoped to an existing Guardian contact record instead of a fresh invite, and
// finishing with the additive Guardian.userProfileId link (Phase 9 Decision 1). Not wrapped in a
// single DB transaction — `inviteUserByEmail` is an external Supabase Auth call that cannot
// participate in a Postgres transaction, matching invite-user.service.ts's own precedent.
export async function linkGuardianAccount(
  input: unknown,
  context: LinkGuardianAccountContext
): Promise<GuardianEntity> {
  const parsed = linkGuardianAccountSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const guardianRepository = new PrismaGuardianRepository();
  const guardian = await guardianRepository.findById(tenantId, data.guardianId);
  if (!guardian || guardian.deletedAt) {
    throw new GuardianNotFoundError();
  }
  if (guardian.userProfileId) {
    throw new GuardianAlreadyLinkedError();
  }

  const email = data.email ?? guardian.email;
  if (!email) {
    throw new ValidationError("An email address is required to create a parent portal account.");
  }

  const roleRepository = new PrismaRoleRepository();
  const parentRole = await roleRepository.findByCode(PARENT_ROLE_CODE);
  if (!parentRole) {
    throw new ValidationError("The Parent system role is not configured.");
  }

  const inviteResult = await inviteUserByEmail(email, { tenant_id: tenantId, full_name: guardian.fullName });
  if (!inviteResult.success) {
    throw new ValidationError("Could not send the invitation. Please try again.");
  }

  const userProfileRepository = new PrismaUserProfileRepository();
  const userProfile = await userProfileRepository.create({
    id: inviteResult.data.authUserId,
    tenantId,
    fullName: guardian.fullName,
    email,
    createdBy: actingUserId,
  });

  const roleAssignment = await assignRole(
    { userId: userProfile.id, roleId: parentRole.id },
    { tenantId, actingUserId }
  );
  if (!roleAssignment.success) {
    throw new ValidationError(roleAssignment.error.message);
  }

  return guardianRepository.linkToUserProfile(tenantId, guardian.id, userProfile.id, actingUserId);
}
