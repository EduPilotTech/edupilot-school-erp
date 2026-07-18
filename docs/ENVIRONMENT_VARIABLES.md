# EduPilot School ERP — Environment Variables

This document describes every environment variable the project uses, where to find its value,
and its security classification. No actual secret values are recorded here or anywhere in
version control — see [.env.example](../.env.example) for the template to copy locally.

## Files

| File | Loaded by | Committed? |
|---|---|---|
| `.env` | Prisma CLI (`prisma.config.ts` runs `import "dotenv/config"`) | No — gitignored |
| `.env.local` | Next.js runtime (built-in support) | No — gitignored |
| `.env.example` | Nobody automatically — it's documentation | **Yes** — the one env-related file that is committed |

In local development both `.env` and `.env.local` typically hold the same Supabase project's
values; they are kept as two files because the Prisma CLI and the Next.js runtime load
environment variables through different mechanisms and do not share one file by convention.

## Variables

### `DATABASE_URL` — server-only, secret

- **Purpose:** the connection string the runtime `PrismaClient` uses (via the `@prisma/adapter-pg`
  driver adapter in [lib/prisma.ts](../lib/prisma.ts)) for all application queries.
- **Value:** Supabase's **pooled** connection string (Supavisor/pgbouncer, transaction mode,
  port `6543`, with `?pgbouncer=true`). Found in Supabase Dashboard → Project Settings →
  Database → Connection string → "Transaction" mode.
- **Never** expose to the browser; never prefix with `NEXT_PUBLIC_`.

### `DIRECT_URL` — server-only, secret

- **Purpose:** the connection string the Prisma CLI uses for `prisma migrate`/`prisma db push`
  (configured in [prisma.config.ts](../prisma.config.ts)). Migrations require session-level
  operations that a transaction-mode pooler does not support, so this must bypass the pooler.
- **Value:** Supabase's **direct** connection string, port `5432`. Found in the same Supabase
  Dashboard screen as `DATABASE_URL`, under "Direct connection" / "Session" mode.
- Same secrecy rules as `DATABASE_URL`.

### `NEXT_PUBLIC_SUPABASE_URL` — public

- **Purpose:** the Supabase project URL used by the browser and server Supabase clients
  ([lib/supabase.ts](../lib/supabase.ts) today; split into `lib/supabase/{client,server}.ts` in a
  later phase per [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)).
- **Value:** Supabase Dashboard → Project Settings → API → Project URL.
- Safe to ship to the browser — it is not a secret by itself.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public

- **Purpose:** the anonymous/public API key used by the Supabase client SDK. Access control for
  data reached through this key is enforced entirely by **Row Level Security**, not by keeping
  this key secret.
- **Value:** Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`.
- Safe to ship to the browser, on the condition that RLS is enabled on every tenant-scoped table
  (see [DATABASE_STANDARDS.md](DATABASE_STANDARDS.md) §4 — this is a hard requirement, not
  optional, precisely because this key is public).

### `SUPABASE_SERVICE_ROLE_KEY` — server-only, secret, **not yet used in code**

- **Purpose:** reserved for `modules/tenancy/infrastructure` (tenant provisioning) and background
  jobs, introduced in a later phase. **Bypasses Row Level Security entirely.**
- **Value:** Supabase Dashboard → Project Settings → API → Project API keys → `service_role`
  `secret`.
- Never prefix with `NEXT_PUBLIC_`. Never import outside `lib/supabase/admin.ts` once that file
  exists. See [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) §5 for the enforcement rule.
- This variable is documented now, ahead of its first use, so the required Supabase project
  configuration is known upfront — it is not yet read by any file in this repository.

## Adding a New Environment Variable

1. Add it to [.env.example](../.env.example) with a placeholder value and a comment explaining
   its purpose and where to obtain a real value.
2. Add an entry to the table above with the same classification format (purpose, value source,
   public/secret, which files may import it).
3. If it's a secret, confirm it is **not** prefixed `NEXT_PUBLIC_` and add an entry to
   [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) §5 if it grants elevated/bypass access
   (anything analogous to the service-role key).
4. Never commit `.env` or `.env.local` — both are gitignored; only `.env.example` is tracked.
