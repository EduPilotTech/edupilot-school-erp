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

### Razorpay

Introduced in Phase 16 (Payment & Subscription Management) for `modules/billing`'s payment
gateway integration — see
[modules/billing/infrastructure/payment-gateway/](../modules/billing/infrastructure/payment-gateway/).

#### `RAZORPAY_KEY_ID` — not secret, but not for public distribution

- **Purpose:** identifies the Razorpay account/API key pair. Used server-side (order creation)
  and client-side (passed to Razorpay's `checkout.js` widget to open the payment sheet).
- **Value:** Razorpay Dashboard → Settings → API Keys → Key Id.
- Not a secret in the sense of `RAZORPAY_KEY_SECRET` — Razorpay's own Checkout widget requires it
  in the browser by design, similar in spirit to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Unlike that key,
  though, it is not currently prefixed `NEXT_PUBLIC_` in this codebase, because Bundle B only
  introduces the server-side gateway integration — no client-side Checkout widget exists yet. Do
  not read it from a Client Component until that UI is built and the variable is deliberately
  re-exposed with a `NEXT_PUBLIC_` prefix at that time.

#### `RAZORPAY_KEY_SECRET` — server-only, secret

- **Purpose:** authenticates server-side Razorpay API calls (order creation, payment capture,
  refunds) and signs the HMAC used to verify the post-checkout signature Razorpay's client-side
  widget returns. See
  [razorpay-gateway-provider.ts](../modules/billing/infrastructure/payment-gateway/razorpay-gateway-provider.ts).
- **Value:** Razorpay Dashboard → Settings → API Keys → Key Secret.
- Never expose to the browser; never prefix with `NEXT_PUBLIC_`. Only
  `modules/billing/infrastructure/payment-gateway/` reads it (via
  [razorpay-env.ts](../modules/billing/infrastructure/payment-gateway/razorpay-env.ts)).

#### `RAZORPAY_WEBHOOK_SECRET` — server-only, secret

- **Purpose:** verifies the `X-Razorpay-Signature` header on inbound Razorpay webhook deliveries
  (`HMAC-SHA256(rawBody, webhookSecret)`). Distinct from `RAZORPAY_KEY_SECRET` — configured
  separately, in the Razorpay Dashboard's webhook settings, not the API Keys screen. See
  [webhook-signature.helpers.ts](../modules/billing/infrastructure/payment-gateway/webhook-signature.helpers.ts).
- **Value:** Razorpay Dashboard → Settings → Webhooks → (your webhook) → Secret.
- Never expose to the browser; never prefix with `NEXT_PUBLIC_`. This is the sole trust boundary
  for anything a Razorpay webhook claims — treat a leak of this value as equivalent in severity
  to a leak of `RAZORPAY_KEY_SECRET`.

### Platform Billing Identity

Introduced in Phase 16 Bundle C (Payment & Subscription Management) for `modules/billing`'s
invoice/receipt PDF generation — see
[invoice-pdf.service.ts](../modules/billing/application/invoice-pdf.service.ts) and
[platform-billing-identity.env.ts](../modules/billing/infrastructure/platform-billing-identity.env.ts).
There is no Prisma model for the platform's own company identity (out of scope for this bundle),
so environment configuration is the established mechanism for "who EduPilot itself is" when it
issues an invoice or receipt to a tenant — the same pattern already used for every
Razorpay/Supabase credential above.

#### `PLATFORM_COMPANY_NAME` — server-only, not secret

- **Purpose:** the legal/trading name printed as the "supplier"/issuer on every platform-issued
  Subscription Invoice and Payment Receipt PDF.
- **Value:** whatever legal name EduPilot's own operating entity trades under — set by whoever
  deploys this application, not obtained from any third-party dashboard.
- Not a secret — it appears on documents handed to tenants by design. Server-only simply because
  it is only ever read while rendering a PDF server-side; there is no client-side use yet.

#### `PLATFORM_COMPANY_ADDRESS` — server-only, not secret

- **Purpose:** the registered/billing address printed alongside `PLATFORM_COMPANY_NAME` on the
  same PDFs.
- **Value:** set by whoever deploys this application.
- Not a secret — same reasoning as `PLATFORM_COMPANY_NAME` above.

#### `PLATFORM_GSTIN` — server-only, not secret

- **Purpose:** the platform's own GSTIN (GST Identification Number), printed on every GST Tax
  Invoice this application issues, exactly like any registered business prints its GSTIN on its
  own outgoing invoices.
- **Value:** the operating entity's real GSTIN, as issued by the Indian GST authorities — set by
  whoever deploys this application.
- Not a secret — a GSTIN is meant to be publicly disclosed on invoices; it grants no access to
  anything and is not a credential.

## Adding a New Environment Variable

1. Add it to [.env.example](../.env.example) with a placeholder value and a comment explaining
   its purpose and where to obtain a real value.
2. Add an entry to the table above with the same classification format (purpose, value source,
   public/secret, which files may import it).
3. If it's a secret, confirm it is **not** prefixed `NEXT_PUBLIC_` and add an entry to
   [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) §5 if it grants elevated/bypass access
   (anything analogous to the service-role key).
4. Never commit `.env` or `.env.local` — both are gitignored; only `.env.example` is tracked.
