import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { School, Tenant, UserProfile } from "@/lib/generated/prisma/client";
import { requireCurrentUser } from "./current-user";

// Resolves the Tenant owning the current UserProfile.
//
// Not wrapped in withTenantContext: Tenant has no tenant_id column of its own to scope by (it
// IS the tenant, per docs/DATABASE_STANDARDS.md §3) — its RLS policy, once written, will be
// scoped by its own `id` instead. Looked up directly by primary key.
//
// `findUniqueOrThrow` deliberately, not a null check: `userProfile.tenantId` is a required,
// foreign-key-enforced column — a missing Tenant here indicates data corruption, not a normal
// "not found" case, and should surface loudly rather than be silently treated as unauthenticated.
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const userProfile = await requireCurrentUser();
  return prisma.tenant.findUniqueOrThrow({ where: { id: userProfile.tenantId } });
});

// Resolves the School owned by the current Tenant. School IS tenant-scoped data, so this query
// goes through withTenantContext — the first real usage of that wrapper in this codebase.
export const getCurrentSchool = cache(async (): Promise<School> => {
  const userProfile = await requireCurrentUser();

  return withTenantContext(userProfile.tenantId, (tx) =>
    tx.school.findUniqueOrThrow({ where: { tenantId: userProfile.tenantId } })
  );
});

// Everything about who is making this request and on whose behalf, assembled once per request
// rather than each Server Action/Component separately re-deriving the same ids. `userId` and
// `tenantId` are always read from this resolved context — never from client input (form fields,
// query params, headers) — per docs/SECURITY_GUIDELINES.md §1.
export interface AuthContext {
  userId: string;
  tenantId: string;
  schoolId: string;
  userProfile: UserProfile;
}

// getCurrentUser/getCurrentTenant/getCurrentSchool are each individually cache()-memoized, so
// composing them here does not cost extra database round-trips beyond what calling any one of
// them directly would already cost within the same request.
export const requireAuthContext = cache(async (): Promise<AuthContext> => {
  const userProfile = await requireCurrentUser();
  const school = await getCurrentSchool();

  return {
    userId: userProfile.id,
    tenantId: userProfile.tenantId,
    schoolId: school.id,
    userProfile,
  };
});
