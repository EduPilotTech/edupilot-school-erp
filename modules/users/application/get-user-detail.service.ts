import "server-only";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import { PrismaUserRoleRepository } from "../infrastructure/prisma-user-role.repository";
import type { UserProfileEntity } from "../domain/user-profile.entity";
import type { UserRoleAssignmentWithRole } from "../domain/user-role.repository";

export interface UserDetail {
  profile: UserProfileEntity;
  roles: UserRoleAssignmentWithRole[];
}

// Read-only — combines a single UserProfile with its current role assignments (by name) for
// the User Details page, so the page makes one service call instead of composing two itself.
export async function getUserDetail(
  userId: string,
  context: { tenantId: string }
): Promise<UserDetail | null> {
  const userProfileRepository = new PrismaUserProfileRepository();
  const profile = await userProfileRepository.findById(context.tenantId, userId);

  if (!profile) {
    return null;
  }

  const userRoleRepository = new PrismaUserRoleRepository();
  const roles = await userRoleRepository.listForUser(context.tenantId, userId);

  return { profile, roles };
}
