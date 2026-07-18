import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Prisma 7 requires an explicit driver adapter — there is no implicit datasource URL
// resolution inside the generated client. `DATABASE_URL` is the pooled (Supavisor/pgbouncer,
// transaction mode) connection string; the direct connection used for migrations lives in
// `prisma.config.ts` / `DIRECT_URL` instead. See docs/DATABASE_STANDARDS.md.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure your Supabase " +
        "connection string — see docs/ENVIRONMENT_VARIABLES.md."
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

declare global {
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

// Reuse a single PrismaClient across module reloads in development (Next.js dev server
// re-evaluates modules on every change); without this, each reload opens a new connection
// pool against the database until the previous ones are exhausted.
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
