# EduPilot School ERP — Project Architecture

## 1. Overview

EduPilot School ERP is a multi-tenant SaaS platform serving multiple schools (tenants) from a
single deployment and a single shared database. Tenant isolation is enforced primarily at the
database layer (Row Level Security), with additional enforcement in the application layer
(Repository Pattern + Clean Architecture) and at the edge (Next.js `proxy.ts`).

**Tenancy model:** shared database, shared schema, row-level isolation via `tenant_id` on every
tenant-scoped table. Schema-per-tenant or database-per-tenant is explicitly rejected for this
product — schools are small-to-mid sized organizations, not enterprises requiring physical
isolation, and a single schema is dramatically cheaper to migrate, operate, and reason about.

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js (App Router) | v16 — see `AGENTS.md` for breaking changes vs. standard Next.js |
| Language | TypeScript (strict mode) | No implicit `any`, no unchecked nulls |
| Auth | Supabase Auth | Cookie-based SSR sessions via `@supabase/ssr` |
| Database | PostgreSQL (via Supabase) | Single shared schema, RLS enabled on every tenant table |
| ORM / query layer | Prisma | Schema of record; migrations generated from `schema.prisma` |
| Styling | Tailwind CSS | Utility-first, no CSS-in-JS |
| Validation | Zod | All service-layer boundaries validate input with Zod schemas |
| Forms | React Hook Form + Zod resolver | Client-side form state and validation |

## 3. Clean Architecture Layers

The codebase is organized in concentric layers. Dependencies only point inward — outer layers
depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────────────────┐
│  Delivery (app/)                                         │
│  Routes, layouts, Server Components, Server Actions       │
│  — thin, framework-specific, no business logic            │
├─────────────────────────────────────────────────────────┤
│  Infrastructure (modules/*/infrastructure)                 │
│  Prisma repository implementations, Supabase adapters      │
├─────────────────────────────────────────────────────────┤
│  Application (modules/*/application)                       │
│  Use-case services, DTOs, Zod schemas, orchestration        │
├─────────────────────────────────────────────────────────┤
│  Domain (modules/*/domain)                                 │
│  Entities, repository interfaces (ports), no framework code │
└─────────────────────────────────────────────────────────┘
```

- **Domain** has zero imports from Next.js, Prisma, or Supabase. It defines *what* the business
  is (entities, invariants, repository interfaces) with no opinion on *how* data is stored.
- **Application** implements use cases against the domain's repository interfaces. It does not
  know whether the repository is backed by Prisma, an in-memory fake, or anything else.
- **Infrastructure** implements the domain's repository interfaces using Prisma/Supabase. This is
  the only layer allowed to import `@prisma/client` or `@supabase/*`.
- **Delivery** (`app/`) wires a request to a session, calls an application service, and translates
  the result/error into a response. It must not contain business rules, direct Prisma calls, or
  direct repository instantiation (use `lib/container.ts`).

## 4. Folder Structure

```
edupilot-school-erp/
├── proxy.ts                       # Next 16 edge gate: session refresh + tenant resolution
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── supabase/
│   ├── migrations/                 # RLS policies, functions, triggers (hand-written SQL)
│   └── config.toml
├── app/
│   ├── (marketing)/                 # public, no session required
│   ├── (auth)/                      # login/register/forgot-password, auth-only layout
│   └── (app)/                       # authenticated, tenant-scoped app shell
│       ├── layout.tsx
│       ├── dashboard/
│       ├── students/
│       │   ├── page.tsx
│       │   ├── [studentId]/page.tsx
│       │   └── actions.ts           # Server Actions for this module only
│       ├── teachers/
│       ├── classes/
│       ├── attendance/
│       ├── parents/
│       └── settings/
├── modules/                         # Clean Architecture core, framework-agnostic
│   ├── students/{domain,application,infrastructure}/
│   ├── teachers/ ...
│   ├── classes/ ...
│   ├── attendance/ ...
│   ├── parents/ ...
│   ├── auth/{application,infrastructure}/
│   └── tenancy/{application,infrastructure}/
├── lib/
│   ├── generated/prisma/             # Prisma Client output (generated, gitignored — `npx prisma generate`)
│   ├── supabase/{client.ts,server.ts,admin.ts}
│   ├── prisma/{client.ts,tenant-context.ts}
│   ├── auth/{session.ts,rbac.ts}
│   ├── container.ts                 # interface -> implementation wiring
│   └── errors.ts
├── components/
│   ├── ui/                          # dumb, reusable primitives
│   └── features/                    # composed, feature-aware components
├── types/
│   └── database.types.ts            # generated via `supabase gen types typescript`
├── docs/                             # this documentation set
└── tests/
    ├── unit/                         # domain + application, no DB
    ├── integration/                  # repository layer against a test Postgres
    └── e2e/                          # Playwright, full flows against a seeded tenant
```

## 5. Multi-Tenancy Data Flow

1. Request hits `proxy.ts` → session refreshed via `@supabase/ssr`, `tenant_id` resolved
   (subdomain or user claim) and attached as a request header.
2. Server Component/Action reads `requireSession()` → gets `{ userId, tenantId, role }`.
3. Application service receives `session`, runs `can(session, action, resource)`, validates input
   with Zod, calls repository methods with `tenantId` passed explicitly.
4. Repository (Prisma) wraps the query in a transaction that sets
   `app.tenant_id` via `set_config(..., true)` (transaction-scoped), so Postgres RLS policies —
   which check `current_setting('app.tenant_id')` — enforce isolation even though Prisma talks to
   Postgres directly instead of through PostgREST.
5. Response flows back up through the same layers; the delivery layer maps domain errors to
   HTTP/UI states.

See [DATABASE_STANDARDS.md](DATABASE_STANDARDS.md) for the RLS policy pattern and
[SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) for why `proxy.ts` is not treated as an
authorization boundary.

## 6. Module Boundaries

Each business module (`students`, `teachers`, `classes`, `attendance`, `parents`) is
self-contained: its domain entities, services, and repository live under its own
`modules/<name>/` folder. Modules may depend on other modules' **application-layer services**
(e.g. `attendance` calling into `students` to validate a student exists) but must never reach
into another module's `infrastructure` layer directly — cross-module data access always goes
through the other module's public service functions.

## 7. Related Documents

- [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md) — Git workflow, commit conventions, PR process
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — naming, TypeScript rules, testing conventions
- [DATABASE_STANDARDS.md](DATABASE_STANDARDS.md) — Prisma/Postgres/RLS/migration rules
- [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) — RBAC, RLS, secrets, auth flow
- [PHASE_STATUS.md](PHASE_STATUS.md) — roadmap and current build phase
