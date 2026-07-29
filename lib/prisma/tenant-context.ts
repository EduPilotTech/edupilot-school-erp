import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

// Wraps a tenant-scoped query/write in a transaction that sets `app.tenant_id` for the lifetime
// of that transaction, per docs/DATABASE_STANDARDS.md §5. Required for every read/write on a
// tenant-scoped table (School, AcademicSession, custom Role, UserRole, ...) so that RLS
// policies checking `current_setting('app.tenant_id')` are enforced even though Prisma talks to
// Postgres directly instead of through PostgREST's session context.
//
// The `true` third argument to `set_config` makes it transaction-local (`SET LOCAL` semantics),
// not session-level — required because Supabase's pooled connection (Supavisor/pgbouncer,
// transaction mode) reuses physical connections across requests; a session-level `SET` would
// leak one tenant's context into another tenant's request on the same pooled connection.
//
// NOT used for: UserProfile lookup by its own id (a self-access pattern that precedes knowing
// the tenant at all — see lib/auth/current-user.ts), or Tenant lookup by its own id (Tenant has
// no tenant_id column to scope by in the first place).
//
// `existingTx` (Sprint 4 — Step 4): optional, additive parameter — every existing caller that
// omits it behaves identically to before (opens its own transaction). When a caller (e.g. a
// multi-repository operation like Student Admission, which must create Student, Guardian,
// StudentGuardian, and Enrollment atomically) already holds an open transaction, passing it here
// makes this call join that transaction instead of opening a new, independent one. Without this,
// composing multiple repository writes into one atomic operation was structurally impossible —
// each repository call would commit (or fail) in its own separate transaction. Re-running
// `set_config` on an already-tenant-scoped transaction is idempotent and harmless.
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  existingTx?: Prisma.TransactionClient
): Promise<T> {
  if (existingTx) {
    await existingTx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return callback(existingTx);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return callback(tx);
  });
}
