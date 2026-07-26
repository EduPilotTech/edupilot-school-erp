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

// Same resolution, but redirects to /login rather than returning null — for Server
// Components/Actions that require a fully provisioned UserProfile to proceed. Redirects here
// cover both "no session" and "session exists but its UserProfile hasn't been provisioned yet"
// (e.g. the Supabase Auth sync webhook hasn't run) — both are treated the same at this layer.
export async function requireCurrentUser(): Promise<UserProfile> {
  const userProfile = await getCurrentUser();

  if (!userProfile) {
    redirect("/login");
  }

  return userProfile;
}
