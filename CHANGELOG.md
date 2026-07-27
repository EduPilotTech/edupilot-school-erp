# Changelog

All notable changes to EduPilot School ERP are documented in this file.

## [Unreleased] — v0.4.0-user-management

### Added
- Core Foundation Prisma models unaffected — no schema changes this release.
- **User Management domain module** (`modules/users/`): `UserProfile`/`Role`/`UserRole` repositories (domain interfaces + Prisma implementations), following the established Repository Pattern.
- **Application services**: invite user, accept invitation, update profile, suspend/activate/deactivate, soft delete/restore, assign/remove role, plus read-only list/detail queries for the UI.
- **Server Actions** (`app/settings/users/actions.ts`): thin action layer — resolve `AuthContext`, check the relevant permission, delegate to the application service. No business logic in the action layer itself.
- **User Administration UI** (`app/settings/users/`): Users List (search/status filter/role filter/pagination), User Details (profile, roles, status actions, metadata), Invite User, Edit User — Server Components by default, Client Components only for forms/dialogs/confirmations.
- **Seed script** (`prisma/seed.ts`): System Roles (Super Admin, School Admin, Principal, Vice Principal, Teacher, Class Teacher, Accountant, Receptionist, Librarian, Parent, Student), the 9 permission codes this release actually uses, and `RolePermission` grants (Super Admin + School Admin only). No customer data.

### Fixed
- **Authentication:** `requireCurrentUser()` (`lib/auth/current-user.ts`) previously only checked that a `UserProfile` existed — it did not verify `status`/`deletedAt`, meaning a suspended, inactive, or soft-deleted user with a still-valid Supabase session could pass straight through to every downstream helper (`getCurrentTenant`, `getCurrentSchool`, `requireAuthContext`, and therefore `getAuthorizationContext`/`requirePermission`/`requireRole`). Fixed centrally, once, in `requireCurrentUser()` — no duplicated checks elsewhere.
- **Authorization:** `resolvePermissions()` (`lib/auth/rbac.ts`) queried `UserRole` filtered only by `userId`, not `tenantId` — inconsistent with every other tenant-scoped query in the codebase, which explicitly filters by `tenantId` rather than relying solely on foreign-key integrity. Not independently exploitable (the FK already guarantees `userId`'s rows share one `tenantId`), but fixed for consistency with the established defense-in-depth convention.
- **Role assignment:** `assignRole()` had no protection against a user granting *themselves* a new protected/administrative role — the mirror image of `removeRole`'s existing "cannot remove your own last administrative role" check, which had no counterpart on the assignment side. Fixed: assigning a protected role to yourself is now blocked, matching `removeRole`'s existing scope and rationale.

### Known Limitations (carried forward, not regressions)
- `AuditLog` does not exist yet — every audit event this release's services reference is a `TODO(audit)` comment at the correct integration point, not a live log.
- Row Level Security policies and the first Prisma migration have not been created — this release's tenant isolation is enforced entirely at the application/repository layer (explicit `tenantId` scoping), not yet backed by a database-level policy.
- The seed script cannot be executed against a real database yet, for the same reason (no migration exists to create the tables it seeds against).
- "Cannot assign role across tenants" for role removal already existed; the equivalent for *reassignment race conditions* (two concurrent assignments) is not specifically tested, relying on the database's `(userId, roleId)` unique constraint as the final backstop.

## [v0.3.0-auth] — Authentication Foundation
Supabase authentication infrastructure (browser/server/admin clients), `proxy.ts` session refresh and route-group redirects, session/tenant/school resolution with request-scoped caching, `lib/prisma/tenant-context.ts`, RBAC permission resolution and authorization helpers, and sign-in/sign-out/forgot-password application services.

## [v0.2.1-marketing] — Marketing Landing Page
Production-grade enterprise landing page redesign (`app/page.tsx`).

## [v0.2.0-rbac] — Enterprise RBAC Foundation
`Role`, `Permission`, `RolePermission`, `UserProfile`, `UserRole` Prisma models — nullable-tenant System/Custom role scoping, composite foreign keys for tenant-integrity guarantees, and the full design/review cycle documented across Sprint 1B.

## [v0.1.0-foundation] — Core Foundation
`Tenant`, `School`, `AcademicSession` Prisma models; Prisma 7 + Supabase infrastructure (`lib/prisma.ts`, `lib/supabase/*`); project documentation set (`docs/`, `CLAUDE.md`).
