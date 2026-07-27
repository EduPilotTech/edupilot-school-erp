import "server-only";
import { listUsersFilterSchema } from "./dto/list-users.dto";
import { PrismaUserProfileRepository } from "../infrastructure/prisma-user-profile.repository";
import type { UserProfileListResult } from "../domain/user-profile.repository";

// Read-only — added in Sprint 3 — Step 4 for the Users List page. Deliberately uses
// safeParse + a hard fallback rather than throwing on invalid input: this is fed from URL
// searchParams, which a user can freely edit; a malformed `?page=abc` should just fall back to
// page 1, not surface an error page for what's ultimately a navigation concern.
export async function listUsers(
  filter: unknown,
  context: { tenantId: string }
): Promise<UserProfileListResult> {
  const parsed = listUsersFilterSchema.safeParse(filter);
  const effectiveFilter = parsed.success ? parsed.data : { page: 1, pageSize: 20 };

  const repository = new PrismaUserProfileRepository();
  return repository.findMany(context.tenantId, effectiveFilter);
}
