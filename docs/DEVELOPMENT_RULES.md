# EduPilot School ERP — Development Rules

## 1. Folder Conventions

- `app/` contains **only** routing, layouts, Server Components, and thin Server Actions. No
  business logic, no direct Prisma/Supabase calls except through `lib/` helpers.
- `modules/<name>/` is the only place business logic lives. Each module has at most three
  subfolders: `domain/`, `application/`, `infrastructure/`. Do not add a fourth without updating
  [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md).
- `lib/` is for cross-cutting, framework-adjacent utilities shared by every module (auth session
  helpers, Prisma/Supabase clients, the DI container, error types). If a helper is specific to one
  module, it belongs in that module, not in `lib/`.
- `components/ui/` holds only presentational, business-logic-free primitives (Button, Input,
  Modal). `components/features/` holds components that know about a domain concept (e.g.
  `StudentTable`) but still receive data as props — they do not fetch data themselves.
- New top-level folders under the repo root require a documented rationale added to
  [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) in the same PR.

## 2. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| React component files | `PascalCase.tsx` | `StudentTable.tsx` |
| Route segment files | lowercase, Next.js reserved names | `page.tsx`, `layout.tsx`, `actions.ts` |
| Non-component TS files | `kebab-case.ts` | `enroll-student.service.ts` |
| Domain entities | `PascalCase` singular | `Student`, `AcademicYear` |
| Repository interfaces | `<Entity>Repository` | `StudentRepository` |
| Repository implementations | `Prisma<Entity>Repository` | `PrismaStudentRepository` |
| Application services | `<verb>-<entity>.service.ts`, exported function `verbEntity` | `enroll-student.service.ts` → `enrollStudent()` |
| Zod schemas | `<entity>Schema` / `<useCase>Schema` | `createStudentSchema` |
| Prisma models | `PascalCase` singular, table name via `@@map("snake_case_plural")` | `model Student { @@map("students") }` |
| Database columns | `snake_case` in Postgres, mapped to `camelCase` in Prisma via `@map` | `first_name` ↔ `firstName` |
| React hooks | `use<Thing>` | `useSession()` |
| Environment variables | `SCREAMING_SNAKE_CASE`, `NEXT_PUBLIC_` prefix only when safe for the browser | `NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL` |
| Branches | see Git Workflow below | |

## 3. Git Workflow

- **`main`** is always deployable. No direct commits to `main` except documentation-only changes
  explicitly approved by the user.
- Branch naming: `<type>/<short-description>`, where `<type>` matches the commit type table below.
  Examples: `feat/student-enrollment`, `fix/attendance-duplicate-mark`, `docs/security-guidelines`.
- One feature/fix per branch. Do not bundle unrelated changes (e.g. a dependency bump and a new
  module) into the same branch/PR.
- Rebase feature branches on top of `main` before opening a PR; do not merge `main` into a
  feature branch as a substitute for rebasing unless the branch is shared with other contributors.
- Every PR must pass: `tsc --noEmit`, lint, unit tests, and (once they exist) integration tests
  against a seeded test database, before merge.
- Squash-merge feature branches into `main` so `main`'s history reads as one commit per
  logical change; keep the PR's own commit history as granular as useful during review.

## 4. Commit Message Conventions

Follow **Conventional Commits**:

```
<type>(<scope>): <short summary>

<optional body — the "why", not the "what">

<optional footer — breaking changes, issue references>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`, `build`, `ci`

**Scope** is the module or area affected: `students`, `attendance`, `auth`, `tenancy`, `db`,
`docs`, `ci`, etc.

Examples:
```
feat(students): add enrollStudent service with capacity check

fix(attendance): prevent duplicate attendance marks for same day

docs(security): document RLS session-context pattern for Prisma

refactor(auth): extract requireSession() from proxy.ts into lib/auth/session.ts
```

Rules:
- Summary line ≤ 72 characters, imperative mood ("add", not "added"/"adds").
- Explain **why** in the body when the change isn't self-evident from the diff — the diff already
  shows *what* changed.
- Reference the relevant phase from [PHASE_STATUS.md](PHASE_STATUS.md) in the body when a commit
  advances or completes a phase milestone.
- Never include secrets, tokens, or connection strings in a commit message.

## 5. Pull Request Process

- PR description states: what changed, why, which phase/module it belongs to, and how it was
  tested (unit/integration/manual).
- Migrations (`prisma/migrations/`, `supabase/migrations/`) included in a PR must be called out
  explicitly in the description — reviewers treat schema changes as higher-risk than application
  code changes.
- Any change touching RLS policies, RBAC rules, or auth flow requires a second reviewer
  familiar with [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md), when the team is larger than
  one contributor.
- Update [PHASE_STATUS.md](PHASE_STATUS.md) in the same PR when a milestone is completed —
  phase status must never lag more than one merged PR behind reality.

## 6. Definition of Done (per module/feature)

A module/feature is not "done" until:
1. Domain entity + repository interface defined.
2. Prisma repository implementation + RLS policy for any new table.
3. Application service(s) with Zod validation and RBAC checks.
4. Thin Server Action(s)/route wiring in `app/`.
5. Unit tests for the application service (business rules), integration test for the repository
   against a real Postgres instance.
6. `docs/PHASE_STATUS.md` updated.
