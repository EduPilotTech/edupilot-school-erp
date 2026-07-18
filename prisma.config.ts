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
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
