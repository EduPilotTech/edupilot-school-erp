import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { UserProfile } from "@/lib/generated/prisma/client";
import { getSession } from "./session";

// Resolves the current session's UserProfile by its own id (= auth.users.id) — a self-access
// lookup that precedes knowing the tenant at all, so it is deliberately NOT wrapped in
// withTenantContext (lib/prisma/tenant-context.ts): there is no tenantId to set yet, and this
// is exactly the query that discovers one.
//
// No permission lookup here — this resolves identity only, not what that identity is allowed
// to do (that belongs to a future RBAC/authorization layer, out of scope for this sprint).
//
// Deliberately does NOT filter by `status`/`deletedAt`: an INVITED profile (mid-onboarding) is
// a legitimate result here, not an error. Enforcing that SUSPENDED/INACTIVE/deleted users are
// blocked from actually using the app is a still-open product/UX decision (different states
// may need different messaging) flagged in Sprint 2 — Step 1 and intentionally not guessed at
// here — it belongs in front of whatever the next authorization-aware layer turns out to be.
//
// Wrapped in React's `cache()` so this DB round-trip happens at most once per request even if
// several Server Components each need the current user.
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.userProfile.findUnique({
    where: { id: session.user.id },
  });
});

// Whether a UserProfile is currently allowed general application access. Exported so other
// code (future user-management UI, admin-facing checks on a *different* user's profile) can
// reuse the same rule rather than re-deriving it — this is the one, centralized definition.
//
// INVITED is deliberately excluded from "active" here: an invited user completing their own
// onboarding does NOT go through requireCurrentUser()/this check — see acceptInvitation in
// modules/users, which resolves the profile directly by auth user id, bypassing this gate on
// purpose. Everywhere else, INVITED means "not yet allowed into the application."
export function isUserProfileActive(userProfile: UserProfile): boolean {
  return userProfile.status === "ACTIVE" && userProfile.deletedAt === null;
}

// Same resolution as getCurrentUser(), but redirects to /login rather than returning null/an
// inactive profile — this is the SINGLE enforcement point the fix below relies on. Every other
// helper in this codebase that needs "the current user" (getCurrentTenant, getCurrentSchool,
// requireAuthContext, and therefore getAuthorizationContext/requirePermission/requireRole in
// lib/auth/rbac.ts) calls this function rather than getCurrentUser() directly — so this one
// check is what closes the gap for all of them, with no duplication elsewhere.
//
// Previously this only checked "does a UserProfile exist" — it did not verify `status`/
// `deletedAt`, meaning a SUSPENDED, INACTIVE, or soft-deleted user with a still-valid Supabase
// session could pass straight through. Fixed here: any UserProfile that is not ACTIVE (or is
// soft-deleted) is treated identically to "not authenticated" for general application access.
//
// All non-ACTIVE states currently redirect to the same /login — there is no dedicated
// "your account is suspended" or "complete your invitation" page yet (no UI built this sprint).
// Differentiating that messaging per status is a future UX improvement, not a correctness gap.
export async function requireCurrentUser(): Promise<UserProfile> {
  const userProfile = await getCurrentUser();

  if (!userProfile || !isUserProfileActive(userProfile)) {
    redirect("/login");
  }

  return userProfile;
}
