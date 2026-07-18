# EduPilot School ERP — Database Standards

## 1. Ownership: Prisma vs. Supabase Migrations

- **`prisma/schema.prisma`** is the schema of record for all application tables (models,
  columns, relations, indexes). `prisma migrate dev`/`deploy` generates versioned SQL from it.
- **`supabase/migrations/`** holds hand-written SQL for everything Prisma cannot express:
  Row Level Security policies, Postgres functions/triggers, extensions (e.g. `pgcrypto`).
  These are applied via the Supabase CLI, always **after** the corresponding Prisma migration.
- Never edit an already-applied migration file in either folder, in any environment beyond local
  development. Once a migration has been applied anywhere shared (preview/staging/production),
  changes are made via a new migration, never by rewriting history.

## 2. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Prisma model | `PascalCase` singular | `model Student { ... }` |
| Postgres table | `snake_case` plural, set via `@@map` | `@@map("students")` |
| Prisma field | `camelCase` | `firstName` |
| Postgres column | `snake_case`, set via `@map` | `@map("first_name")` |
| Foreign key field | `<entity>Id` / column `<entity>_id` | `classId` / `class_id` |
| Join/pivot table | `PascalCase` combining both entities, table `snake_case` | `StudentGuardian` → `student_guardians` |
| Enum | `PascalCase` type, `SCREAMING_SNAKE_CASE` members | `enum Role { SCHOOL_ADMIN TEACHER PARENT STUDENT }` |
| Index | Prisma default naming unless a composite index needs a documented rationale | `@@index([tenantId, classId, date])` |

## 3. Mandatory Columns on Every Tenant-Scoped Table

Every table that stores tenant data (i.e., everything except the `Tenant` table itself and
genuinely global reference data) **must** include:

```prisma
model Student {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")   // soft delete — never hard-delete tenant data

  @@index([tenantId])
  @@map("students")
}
```

- `tenantId` is required (non-nullable), indexed, and is always the **first** column checked in
  any `WHERE` clause and the first segment of any composite index.
- Soft delete (`deletedAt`) is the default for anything a school might need to recover (students,
  teachers, enrollments). Hard deletes are reserved for genuinely transient data (draft rows,
  expired sessions) and must be justified in the PR description.
- `id` is a UUID generated with Prisma's `@default(uuid())`, never an auto-increment integer —
  sequential IDs leak tenant record counts and complicate multi-region replication later.
  `@default(uuid())` is the **only** approved ID strategy for this project: it requires no
  database extension (unlike `dbgenerated("gen_random_uuid()")`, which depends on `pgcrypto`
  being enabled), keeping ID generation portable and consistent across every table without a
  migration-ordering dependency on an extension being installed first.

## 4. Row Level Security Rules

- **RLS is enabled on every tenant-scoped table, no exceptions.** A table without RLS enabled is
  a bug, not an oversight to fix later — do not merge a migration that adds a tenant-scoped table
  without its accompanying RLS policy in the same PR.
- Standard policy pattern (see [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) for why
  `current_setting('app.tenant_id')` is used instead of relying solely on `auth.uid()`):

  ```sql
  alter table students enable row level security;

  create policy tenant_isolation_select on students
    for select
    using (tenant_id::text = current_setting('app.tenant_id', true));

  create policy tenant_isolation_write on students
    for insert with check (tenant_id::text = current_setting('app.tenant_id', true));

  create policy tenant_isolation_update on students
    for update
    using (tenant_id::text = current_setting('app.tenant_id', true))
    with check (tenant_id::text = current_setting('app.tenant_id', true));
  ```

- Role-based restrictions (e.g. parents may only `select` their own children) are additional
  policies layered on top of tenant isolation, never a replacement for it.
- Every new table's migration PR must include a corresponding RLS policy file in
  `supabase/migrations/`, and a test in `tests/integration/` that asserts a query scoped to
  tenant A cannot read/write tenant B's rows.

## 5. Prisma + RLS: the Session Context Rule

Prisma connects directly to Postgres and does not automatically carry the Supabase JWT/session
context that PostgREST provides. Every Prisma read/write on a tenant-scoped table **must** go
through `lib/prisma/tenant-context.ts`, which sets the session variable inside the same
transaction as the query:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  return tx.student.findMany({ where: { tenantId } });
});
```

- The `true` argument to `set_config` makes it **transaction-local** (`SET LOCAL` semantics) —
  required because Supabase's connection pooler (transaction mode / pgbouncer) reuses physical
  connections across requests; a session-level `SET` would leak one tenant's context into
  another tenant's request on the same pooled connection.
- Repository methods never call `prisma.<model>` directly outside this wrapper. Direct access to
  the raw `PrismaClient` singleton is restricted to `lib/prisma/` and `modules/tenancy/infrastructure`.

## 6. Migration Rules

- **Ordering:** Prisma migration (schema shape) → Supabase migration (RLS/functions/triggers
  referencing that shape). CI applies both, in that order, against a fresh database on every PR.
- **Expand/contract for backward compatibility:** because Next.js deploys can briefly run old and
  new server instances simultaneously, schema changes that remove or narrow something (drop
  column, drop table, add a `NOT NULL` to an existing column, tighten a check constraint) ship at
  least one release **after** the additive change and after confirming no code path still depends
  on the old shape. Additive changes (new nullable column, new table, new index) can ship in the
  same release as the code using them.
- **Never run `prisma migrate dev` against staging or production.** Only `prisma migrate deploy`,
  executed by CI, against environments gated on a green preview-environment run.
- **Data backfills** for a new non-nullable column are a separate migration step from adding the
  column: add nullable → backfill via script/seed → add `NOT NULL` in a follow-up migration.
- **Type generation:** `supabase gen types typescript` is regenerated in CI whenever
  `supabase/migrations/` changes and committed to `types/database.types.ts`. A lint/CI step
  checks that Prisma's generated types and the Supabase-generated types haven't silently
  diverged (e.g. a column renamed in one but not the other).

## 7. Indexing Rules

- Every foreign key column is indexed.
- Composite indexes are ordered `(tenant_id, <most selective filter>, ...)` so that RLS's
  `tenant_id` predicate and the query's own filter both hit the same index — e.g.
  `@@index([tenantId, classId, date])` on `Attendance`.
- Avoid indexing low-cardinality boolean/enum columns alone; combine them with `tenantId` or
  another selective column instead.

## 8. Seeding

- `prisma/seed.ts` seeds a small number of representative tenants (at least two, to make
  cross-tenant isolation bugs visible immediately in local development) with realistic academic
  years, classes, teachers, students, and a few weeks of attendance history.
- Seed data never includes real student/guardian PII — use clearly fake names and a fixed,
  documented seed for reproducibility.
