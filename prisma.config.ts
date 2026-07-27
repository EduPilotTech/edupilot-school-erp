// Prisma CLI configuration (schema location, migrations path, CLI datasource connection).
//
// This file governs `prisma migrate`/`db push`/`studio` — the CLI's own connection. It is
// separate from the runtime `PrismaClient` connection configured in lib/prisma.ts.
//
// `DIRECT_URL` (non-pooled, port 5432) is used here because Supabase's pooled connection
// (Supavisor/pgbouncer, port 6543, transaction mode) does not support the session-level
// operations Prisma Migrate performs. See docs/DATABASE_STANDARDS.md and .env.example.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Runs prisma/seed.ts via `prisma db seed` / after `prisma migrate reset`. Seeds System
    // Roles, Permissions, and RolePermission grants only — never customer data (Tenant/School/
    // UserProfile), per docs/DATABASE_STANDARDS.md §8 and Sprint 3 — Step 5 Part B. Cannot
    // actually run yet: no migration has been applied, so there are no tables to seed against
    // (see docs/PHASE_STATUS.md) — configured now so it's ready the moment one exists.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
