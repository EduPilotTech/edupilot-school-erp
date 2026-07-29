import "server-only";
import { getCurrentUser, isUserProfileActive } from "@/lib/auth/current-user";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import { resolvePermissions } from "@/lib/auth/rbac";
import { ValidationError, BusinessRuleError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import type { UserProfile } from "@/lib/generated/prisma/client";

export class ApiAuthError extends Error {
  readonly status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiAuthError";
  }
}

export interface ApiAuthContext {
  userId: string;
  tenantId: string;
  userProfile: UserProfile;
  permissionCodes: ReadonlySet<string>;
}

// The API-route counterpart to lib/auth/rbac.ts's getAuthorizationContext() — deliberately NOT a
// reuse of requireAuthContext()/requireCurrentUser(), which redirect to /login on failure (a
// browser-UX concern, fine for Server Components, wrong for a JSON API). A REST API meant for a
// future Android/iOS client (requirement 25 / Decision 5: same application services, different
// delivery) must return a clean 401/403 JSON response instead of an HTTP redirect to an HTML
// login page. Reuses the exact same `resolvePermissions` query getAuthorizationContext() does —
// only the failure behavior differs.
export async function requireApiAuthContext(): Promise<ApiAuthContext> {
  const userProfile = await getCurrentUser();
  if (!userProfile || !isUserProfileActive(userProfile)) {
    throw new ApiAuthError(401, "Not authenticated.");
  }

  const { permissionCodes } = await resolvePermissions(userProfile.tenantId, userProfile.id);

  return {
    userId: userProfile.id,
    tenantId: userProfile.tenantId,
    userProfile,
    permissionCodes,
  };
}

export function requireApiPermission(context: ApiAuthContext, permissionCode: string): void {
  if (!context.permissionCodes.has(permissionCode)) {
    throw new ApiAuthError(403, "You are not authorized to perform this action.");
  }
}

// Shared error -> Response mapping for every app/api/parent/v1/**/route.ts handler — only maps
// the known, typed domain error hierarchy (same `instanceof`-only discipline as every
// translateXError in this codebase, docs/CODING_STANDARDS.md §5). A genuinely unexpected error is
// rethrown, never swallowed into a client-facing 400 that could leak internal detail
// (docs/SECURITY_GUIDELINES.md §10) — it surfaces as Next.js's own unhandled-route-error 500.
export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiAuthError) {
    return Response.json({ error: { message: error.message } }, { status: error.status });
  }
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: { message: error.message } }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return Response.json({ error: { message: error.message } }, { status: 404 });
  }
  if (error instanceof BusinessRuleError) {
    return Response.json({ error: { message: error.message } }, { status: 409 });
  }
  if (error instanceof ValidationError) {
    return Response.json({ error: { message: error.message } }, { status: 400 });
  }
  throw error;
}

// `withTenantContext` re-exported so route handlers that need a direct, tenant-scoped read for
// something with no existing application service (rare) don't need a second import path.
export { withTenantContext };
