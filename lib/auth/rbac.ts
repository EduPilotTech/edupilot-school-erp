import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import { requireAuthContext, type AuthContext } from "./auth-context";

// --- Permission version placeholder -----------------------------------------------------

// Placeholder for the future cross-request permission cache + invalidation mechanism described
// in Sprint 2 — Step 1 §5 ("permissions version" counter). NOT implemented here: there is no
// cross-request cache to invalidate yet — permission resolution below is request-scoped only,
// via React's cache() — and no schema column backs this value (no Prisma schema changes this
// sprint). `version` is always 0 today.
//
// The eventual real mechanism: (1) a monotonic counter column (e.g. Tenant.permissionsVersion),
// incremented whenever a role/permission assignment changes; (2) a cross-request cache storing
// the version a cached permission set was computed against; (3) a comparison against the
// current version on each read, forcing a recompute on mismatch rather than waiting for the
// next Supabase token refresh. This type exists so that shape is visible now, not a design
// decision finalized here.
export interface PermissionVersion {
  readonly version: number;
}

const CURRENT_PERMISSION_VERSION: PermissionVersion = { version: 0 };

// --- Permission resolution ----------------------------------------------------------------

export interface AuthorizationContext extends AuthContext {
  roleCodes: ReadonlySet<string>;
  permissionCodes: ReadonlySet<string>;
  permissionVersion: PermissionVersion;
}

// UserRole -> Role -> RolePermission -> Permission, resolved in one query (no N+1) and wrapped
// in withTenantContext since UserRole is tenant-scoped data (docs/DATABASE_STANDARDS.md §5).
// Excludes soft-deleted Roles and deprecated Permissions — neither should grant access even if
// a stale row still references them.
//
// Request-scoped memoization only (React cache()) — deliberately NOT cached across requests.
// See PermissionVersion above for why that's a placeholder, not an oversight.
const resolvePermissions = cache(async (tenantId: string, userId: string) => {
  const userRoles = await withTenantContext(tenantId, (tx) =>
    tx.userRole.findMany({
      // `tenantId` is included explicitly, not just relied on via the UserRole -> UserProfile
      // composite FK (which already guarantees a given userId's rows all share one tenantId).
      // Bug found during Sprint 3 — Step 5 review: every other tenant-scoped query in this
      // codebase filters by tenantId explicitly, even when a FK makes it technically redundant
      // (see prisma-user-profile.repository.ts's findByEmail for the same pattern) — this one
      // didn't, breaking that defense-in-depth convention.
      where: { userId, tenantId, role: { deletedAt: null } },
      select: {
        role: {
          select: {
            code: true,
            rolePermissions: {
              select: { permission: { select: { code: true, isDeprecated: true } } },
            },
          },
        },
      },
    })
  );

  const roleCodes = new Set<string>();
  const permissionCodes = new Set<string>();

  for (const { role } of userRoles) {
    if (role.code) {
      roleCodes.add(role.code);
    }
    for (const { permission } of role.rolePermissions) {
      if (!permission.isDeprecated) {
        permissionCodes.add(permission.code);
      }
    }
  }

  return { roleCodes, permissionCodes };
});

// Everything requireAuthContext() already provides, plus the resolved role/permission sets.
// Request-scoped via cache() — calling this multiple times in one request costs one additional
// query (resolvePermissions) beyond requireAuthContext's own cost, not one per call.
export const getAuthorizationContext = cache(async (): Promise<AuthorizationContext> => {
  const authContext = await requireAuthContext();
  const { roleCodes, permissionCodes } = await resolvePermissions(
    authContext.tenantId,
    authContext.userId
  );

  return {
    ...authContext,
    roleCodes,
    permissionCodes,
    permissionVersion: CURRENT_PERMISSION_VERSION,
  };
});

// --- Pure checks -----------------------------------------------------------------------

// Pure and synchronous by design (unlike getAuthorizationContext) — takes an already-resolved
// AuthorizationContext rather than resolving one itself, so these are trivially testable without
// mocking React's cache() or the database, and composable in code that already has a context in
// hand from an earlier call in the same request.
export function hasPermission(context: AuthorizationContext, permissionCode: string): boolean {
  return context.permissionCodes.has(permissionCode);
}

export function hasRole(context: AuthorizationContext, roleCode: string): boolean {
  return context.roleCodes.has(roleCode);
}

// Matches the `can(session, action, resource)` naming from docs/SECURITY_GUIDELINES.md §4.
// `resource` is not yet a parameter here — no permission in this system is resource-instance-
// scoped yet (e.g. "edit this specific student"), only resource-type-scoped (e.g.
// "student.create"); adding instance-level checks is a future extension, not a redesign.
export function can(context: AuthorizationContext, permissionCode: string): boolean {
  return hasPermission(context, permissionCode);
}

export function cannot(context: AuthorizationContext, permissionCode: string): boolean {
  return !can(context, permissionCode);
}

// --- Authorization helpers ---------------------------------------------------------------

// "Not authenticated at all" is already handled upstream by requireAuthContext() ->
// requireCurrentUser() -> requireSession(), which redirects to /login. By the time either
// helper below runs, the user IS authenticated — what's being checked here is authorization for
// this specific action, a different failure mode with a different correct response.
//
// Uses the stable `notFound()` rather than Next.js's purpose-built `forbidden()`/`unauthorized()`
// functions: those remain `experimental` in this Next.js version, gated behind the
// `experimental.authInterrupts` config flag, which is a real config change beyond this file's
// scope to enable unreviewed. `notFound()` is the long-standing, stable pattern for "authenticated
// but not authorized" specifically because it avoids confirming a route/resource's existence to
// a user who isn't allowed to see it. Revisit once a dedicated forbidden.tsx page is built and
// `authInterrupts` is deliberately enabled.
export async function requirePermission(permissionCode: string): Promise<AuthorizationContext> {
  const context = await getAuthorizationContext();

  if (!can(context, permissionCode)) {
    notFound();
  }

  return context;
}

export async function requireRole(roleCode: string): Promise<AuthorizationContext> {
  const context = await getAuthorizationContext();

  if (!hasRole(context, roleCode)) {
    notFound();
  }

  return context;
}
