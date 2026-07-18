# EduPilot School ERP — Security Guidelines

EduPilot handles data about minors (students) and their guardians. Security is treated as a
first-class requirement, not a hardening pass at the end.

## 1. Defense-in-Depth Model

Tenant isolation and authorization are enforced at **three independent layers**. Each layer must
be sufficient on its own — never rely on a single layer, and never remove a layer's check on the
assumption that "another layer already handles it":

1. **Database (Row Level Security)** — every tenant-scoped table has RLS enabled with a
   tenant-isolation policy (see [DATABASE_STANDARDS.md](DATABASE_STANDARDS.md) §4). This is the
   last line of defense: even a buggy or compromised service cannot read/write across tenants.
2. **Application (Repository + Service layer)** — every repository method requires an explicit
   `tenantId`; every application service calls `can(session, action, resource)` before touching
   a repository. This stops logic bugs before they ever reach the database.
3. **Edge (`proxy.ts`)** — resolves session and tenant, redirects unauthenticated/wrong-tenant
   requests for UX purposes. **This is not an authorization boundary** (see §2).

## 2. Why `proxy.ts` Is Not Trusted as an Authorization Boundary

This project runs Next.js 16, which renamed `middleware.ts` to `proxy.ts` (see `AGENTS.md`).
Next.js's own documentation for this version states explicitly that Server Functions
(Server Actions) are invoked as direct POST requests to the route that defines them, and that a
proxy `matcher` excluding a path does **not** stop that page's Server Actions from being called
directly. Practical implications:

- **Every Server Action must call `requireSession()` and the relevant `can()` check itself**,
  even if the page it's colocated with is already gated by `proxy.ts`.
- Do not assume "the user reached this page, so they're authorized" inside a Server Action —
  authenticate and authorize inside the action, unconditionally.
- `proxy.ts`'s job is: refresh the Supabase session cookie, resolve `tenant_id`, and redirect for
  UX (send unauthenticated users to `/login`, send authenticated users away from `/login`). It is
  not where authorization decisions are made.

## 3. Authentication Flow

- Supabase Auth (email/password, optionally magic link/OAuth later) via `@supabase/ssr`'s
  cookie-based session — never store tokens in `localStorage`/`sessionStorage`.
- `proxy.ts` refreshes the access token on every matched request and re-sets cookies on the
  response — this is the one piece of session logic that must live at the edge, since only the
  edge layer can rewrite outgoing cookies before a page renders.
- `lib/auth/session.ts` exposes `getSession()` (nullable, for optional-auth pages) and
  `requireSession()` (throws `UnauthorizedError`, for anything requiring a signed-in user).
- Passwords are never handled directly by application code beyond passing them to Supabase's
  `signInWithPassword`/`signUp` calls — no custom hashing, no storing raw passwords anywhere,
  ever.

## 4. RBAC (Role-Based Access Control)

- Roles: `SUPER_ADMIN` (EduPilot ops, not tenant-scoped), `SCHOOL_ADMIN`, `TEACHER`, `PARENT`,
  `STUDENT` (future portal access).
- `lib/auth/rbac.ts` defines the permission matrix and a single `can(session, action, resource)`
  guard — application services call this before any mutation and before returning any
  sensitive read. Do not scatter ad-hoc `if (role === "...")` checks across the codebase; all
  authorization logic funnels through `can()` so the matrix stays auditable in one place.
- A user belongs to exactly one tenant (their school). `SUPER_ADMIN` bypasses tenant scoping via
  a distinct claim, not by being tenant-less — every table/query still requires a `tenantId`,
  `SUPER_ADMIN` tooling explicitly iterates tenants rather than querying "all tenants" implicitly.

## 5. Secrets & Key Isolation

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to ship to the browser
  — they are meaningless without RLS, which is why RLS must never be disabled "temporarily."
- The Supabase **service-role key** and Prisma's direct `DATABASE_URL` are server-only secrets,
  never prefixed `NEXT_PUBLIC_`, and never imported outside:
  - `lib/supabase/admin.ts` (service-role client)
  - `modules/tenancy/infrastructure/` (tenant provisioning)
  - background job runners
  A lint rule (`no-restricted-imports`) should enforce this boundary at build time, not rely on
  review alone.
- No secret is ever logged, included in an error message surfaced to the client, or committed to
  the repository. `.env.local` stays git-ignored (already confirmed in this repo's
  `.gitignore`).

## 6. Input Validation

- Every Server Action and route handler validates input with Zod before it reaches any service or
  repository (see [CODING_STANDARDS.md](CODING_STANDARDS.md) §4).
- Treat all client-supplied data — form fields, query params, headers except those set by
  `proxy.ts` itself — as untrusted, regardless of whether the user is authenticated.

## 7. Audit Logging

- Every mutating application service call writes an `AuditLog` row: actor, tenant, action,
  resource type/id, and a before/after diff where feasible.
- Audit logs are required for this product (data about minors) and are the primary tool for
  investigating a support/security incident without needing direct production database access.
- Audit log writes never block the primary operation on failure — log the audit failure itself
  and continue, rather than failing a legitimate user action because logging failed.

## 8. PII Handling

- Sensitive fields: student/guardian names, date of birth, contact info, addresses. These fields:
  - are covered by RLS like any other tenant data, plus role-scoped policies (e.g. a parent can
    only read their own children's records, a teacher only their assigned classes' students);
  - are excluded from any analytics, logging, or error-reporting pipeline — never log a full
    entity object that might contain PII, log identifiers (`studentId`) instead;
  - are scoped through the same repository/RLS path for exports/reports as for normal reads —
    a "generate report" feature must never use the admin/service-role client as a shortcut.

## 9. Rate Limiting & Abuse Prevention

- Auth endpoints (`login`, `register`, `forgot-password`) are rate-limited by IP and by account,
  layering Supabase Auth's built-in limits with an application-level check on repeated failed
  logins per account.
- Webhook endpoints (`app/api/webhooks/*`) verify a signature (Supabase webhook secret, or the
  relevant provider's signature scheme) before processing — an unauthenticated POST to a webhook
  route is never treated as trustworthy tenant data.

## 10. OWASP-Relevant Reminders

- **Injection:** all database access goes through Prisma's parameterized queries or `$queryRaw`
  with tagged-template parameterization — never string-concatenated SQL, ever, including inside
  the `set_config` tenant-context call (use Prisma's tagged template, not manual string building).
- **Broken access control:** covered by the three-layer model in §1 — this is the single most
  important category for a multi-tenant app and the reason RLS is mandatory, not optional
  hardening.
- **Cryptographic failures:** rely on Supabase-managed auth/session crypto rather than
  hand-rolling token generation, password hashing, or session signing.
- **XSS:** React's default escaping covers most cases; any `dangerouslySetInnerHTML` usage
  requires explicit sanitization and a comment justifying why it's needed.
- **SSRF/CSRF:** Server Actions are POST-only and same-origin by the framework's own protections;
  do not add a custom fetch-from-user-supplied-URL feature without a dedicated review of the
  destination allowlist.

## 11. Security Review Triggers

Any change touching the following requires explicit attention to this document before merge:
- `prisma/schema.prisma` (new tenant-scoped table without an accompanying RLS policy)
- `supabase/migrations/` (RLS policy changes)
- `proxy.ts`
- `lib/auth/*`
- `lib/supabase/admin.ts` or any new usage of the service-role key
- Any Server Action that returns data involving another user's or another tenant's records
