@AGENTS.md

# EduPilot School ERP — AI Assistant Instructions

This file is the entry point for any AI assistant (Claude Code or otherwise) working in this
repository. Read this file, `AGENTS.md` (imported above), and the documents in `docs/` before
making changes.

## What this project is

EduPilot School ERP is a **multi-tenant SaaS** application for schools, built with:

- Next.js App Router (this repo runs Next.js 16 — note the `middleware.ts` → `proxy.ts` rename
  and other breaking changes documented in `AGENTS.md`; do not assume standard Next.js
  conventions from training data without checking `node_modules/next/dist/docs/`)
- TypeScript in **strict mode**
- Supabase (Auth, Postgres, RLS, Storage)
- Prisma (schema of record, query layer for server-side business logic)
- PostgreSQL with Row Level Security as the primary tenant-isolation boundary
- Clean Architecture + Repository Pattern for all business logic
- RBAC (role-based access control) layered on top of Supabase Auth

## Required reading before writing code

| Document | Read this before... |
|---|---|
| [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md) | Adding any new module, folder, or layer |
| [docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md) | Committing, branching, or opening a PR |
| [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) | Writing any TypeScript/React code |
| [docs/DATABASE_STANDARDS.md](docs/DATABASE_STANDARDS.md) | Touching `prisma/schema.prisma` or `supabase/migrations/` |
| [docs/SECURITY_GUIDELINES.md](docs/SECURITY_GUIDELINES.md) | Writing auth, RLS, RBAC, or anything handling PII |
| [docs/PHASE_STATUS.md](docs/PHASE_STATUS.md) | Deciding what to build next |

## Non-negotiable rules (summary — full detail in docs/)

1. **Never bypass Row Level Security.** The Supabase service-role client and Prisma's direct
   connection both bypass RLS. Both are server-only and restricted to `modules/tenancy/infrastructure`
   and background jobs — never import them inside a per-tenant feature module or client component.
2. **Every repository method takes `tenantId` explicitly.** No ambient/global tenant context in
   the repository layer. See [docs/DATABASE_STANDARDS.md](docs/DATABASE_STANDARDS.md).
3. **Business logic lives in `modules/*/application` (services), not in `app/` routes or Server
   Actions.** Route handlers and Server Actions are thin: authenticate, delegate, translate errors.
4. **Never trust `proxy.ts` as the sole authorization boundary.** It is a UX redirect. Every Server
   Action must independently call `requireSession()` and the RBAC `can()` check — a Server Action
   is reachable directly by POST regardless of proxy matcher coverage.
5. **Do not implement ERP business modules (students, teachers, attendance, classes, parents)
   until the foundation phase (Phase 0 in [docs/PHASE_STATUS.md](docs/PHASE_STATUS.md)) is marked
   complete**, unless the user explicitly asks you to skip ahead.
6. **TypeScript strict mode is non-negotiable.** No `any`, no `// @ts-ignore` without a linked
   issue, no disabling strict flags in `tsconfig.json`.
7. Follow the commit message and branching conventions in
   [docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md) for every commit, even small ones.

## When instructions conflict

If a user request conflicts with a rule in `docs/`, surface the conflict explicitly and ask
before proceeding — do not silently override documented architecture decisions. If a document
in `docs/` appears stale relative to the actual codebase, say so and propose an update rather
than quietly following outdated guidance.
