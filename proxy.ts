import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

// EduPilot School ERP — request-level proxy (Next.js 16's renamed `middleware.ts` convention;
// see AGENTS.md). This is a UX redirect layer only — see docs/SECURITY_GUIDELINES.md §2 for why
// it is never treated as the authorization boundary. Every Server Action must still call
// requireSession() (not yet built) independently, regardless of whether a request reached it
// through here.
//
// Responsibilities, and only these:
//   - refresh the Supabase session and persist any refreshed cookies on the response
//   - redirect anonymous users away from protected/platform routes, to /login
//   - redirect authenticated users away from the auth routes, to /dashboard
//
// Deliberately does NOT: query Prisma, join RolePermission/UserRole, or make any authorization
// decision. It only ever asks "is there a session at all" — never "is this session allowed to
// do X." Route groups like (auth)/(dashboard) do not appear in the actual URL, so pathnames
// below are the real paths a request arrives with.

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// Every real top-level module route directory under app/ (Glob'd directly), excluding the
// (auth) route group (login/register/forgot-password — deliberately anonymous-reachable),
// `api` (route handlers, not page navigations — not applicable here), and `/platform` (kept as
// its own separate PLATFORM_ROUTE_PREFIX below, exactly as before). This replaces the stale
// Phase-0-era list that only covered 7 of the 24 real module route trees that now exist.
const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/settings",
  "/students",
  "/teachers",
  "/academics",
  "/attendance",
  "/fees",
  "/classes",
  "/communication",
  "/employee-portal",
  "/examinations",
  "/finance",
  "/hostel",
  "/hr",
  "/library",
  "/notification",
  "/notifications",
  "/parent",
  "/parents",
  "/payroll",
  "/templates",
  "/timetable",
  "/transport",
  "/billing",
];

// Treated as protected at this layer, same as everything above — proxy.ts only confirms a
// session exists, not that the session belongs to a Super Admin. That check is an authorization
// decision for a future RBAC-aware layer, not for this file.
const PLATFORM_ROUTE_PREFIX = "/platform";

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSupabaseSession(request);

  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isProtectedRoute =
    matchesRoute(pathname, PROTECTED_ROUTE_PREFIXES) ||
    matchesRoute(pathname, [PLATFORM_ROUTE_PREFIX]);

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images/|static/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
