# Phase 16 — Payment & Subscription Management: Final Report

**Status:** Complete. **Release:** v0.16.0. **Delivered as:** Architecture Review → Database
Review → Prisma Schema → Bundle A (core domain/services) → Bundle B (Razorpay + webhooks) →
Bundle C (invoicing/reporting) → Bundle D (lifecycle/automation) → Bundle E (UI), each frozen and
approved before the next began.

---

## 1. Files Created

| Area | Count | Notes |
|---|---|---|
| `modules/billing/` (domain + infrastructure + application, incl. tests) | 126 files | 91 source, 35 test |
| `app/billing/` (School Billing + Subscription UI, Server Actions) | 13 files | |
| `app/platform/` (Platform Admin UI) | 9 files | |
| `app/settings/billing/`, `app/settings/payment/` | 2 files | |
| `components/features/billing/`, `components/features/platform/` | 7 files | |
| `prisma/migrations/` | 2 folders | Phase 16 schema + `SUBSCRIPTION_ALERT` enum value |

Full per-bundle file lists were returned at the end of each bundle in this engagement's own
session transcript; this report summarizes rather than re-enumerates every path.

## 2. Files Modified

All additive; no existing field, model, or method signature was renamed or removed.

- `prisma/schema.prisma` — 9 new models, 7 new enums (Bundle A schema step), plus one later
  additive enum value (`NotificationType.SUBSCRIPTION_ALERT`, Bundle D Part 2) for reminder
  dispatch.
- `Tenant` — 4 new relation arrays only (`subscriptions`, `subscriptionInvoices`, `payments`,
  `platformAuditLogs`); no existing column touched.
- `modules/communication/domain/notification.entity.ts` — the hand-maintained
  `NotificationTypeValue` union extended with `"SUBSCRIPTION_ALERT"` (kept in sync with the Prisma
  enum, same as every prior `*_ALERT` addition).
- `components/features/notifications/notification-type-labels.ts` — one label entry added for the
  same reason.
- `prisma/seed.ts` — 3 new permission codes (`platform.billing.manage`, `billing.subscription
  .manage`, `billing.invoice.view`).
- `lib/storage/buckets.ts` — `PLATFORM_INVOICES_BUCKET` constant added.
- `docs/ENVIRONMENT_VARIABLES.md`, `.env.example` — Razorpay and Platform Billing Identity
  variable documentation added.
- Six small, individually-flagged **additive repository-interface extensions** across the
  engagement (each documented at the time it was made): `WebhookEventRepository
  .markProcessingResult`, `PaymentRepository.findByGatewayOrderIdAnyTenant` /
  `findByGatewayPaymentIdAnyTenant` / `findByTenant`, `SubscriptionInvoiceRepository.findByTenant`
  / `updateStorageKey`, `SubscriptionRepository.updateLifecycleStatus`. Every one adds a new
  method only — no existing method's signature or behavior changed.
- One append to `app/billing/school-actions.ts` (Bundle E Part Three): `generateInvoicePdfAction`.

## 3. Services (by bundle)

- **Bundle A** — Subscription CRUD (close-then-create revision history), Plan Catalog CRUD
  (`SubscriptionPlanDefinition` + `PlanFeatureEntitlement`), Billing Run (batch invoice
  generation), Invoice Generation (atomic per-financial-year numbering), Payment Recording,
  Webhook Recording (persistence only, no processing), License Validation, Feature Entitlement
  Resolution.
- **Bundle B** — `RazorpayGatewayProvider` (order/capture/refund/fetch/checkout-signature),
  webhook signature verification + replay-timestamp heuristic + idempotency-key derivation,
  webhook ingestion + dispatch (`payment.captured`/`payment.failed`/`refund.*`/
  `subscription.charged`), Payment Processing, Refund Processing.
- **Bundle C** — GST breakdown calculation, Invoice PDF / GST Invoice generation (persisted),
  Payment Receipt generation (on-demand, unpersisted), Invoice History / Outstanding / Paid
  Invoice lists, Cancel Invoice, Payment History / Refund History, Billing Dashboard, Collection /
  Outstanding / Monthly Revenue Reports.
- **Bundle D** — Subscription lifecycle transition table + mutation service, Tenant Access
  Validation (License Validation composed with School Suspension), Feature Lock, School
  Activation/Suspension, reminder eligibility + dispatch (Renewal/Grace/Expiry via
  `dispatchNotification`), Auto-Renewal, three daily background-job entry points.
- **Bundle E** — `listSchoolsForManagement` (the one minimal additive read the UI needed), all
  Server Actions wiring the above into the UI.

## 4. REST APIs

None built. Bundle E's scope covered web UI only; no mobile-facing REST namespace was requested
or added for Phase 16.

## 5. UI Pages

- **Platform Admin** (`/platform/**`, `SUPER_ADMIN`-only): hub, Subscription Dashboard, Billing
  Dashboard, Payment Dashboard, School Management (suspend/activate), Plan Catalog
  (list/detail/entitlements), Billing Runs (list/detail/process/lock).
- **School Billing** (`/billing/**`, tenant-scoped): hub, Invoice List (status-filterable),
  Invoice Detail (PDF generate/download, Pay Now, Cancel), Payment History + Refund History,
  Receipt download route.
- **Subscription** (`/billing/subscription/**`): Current Plan + Expiry status banner, Subscribe/
  Renew/Upgrade/Cancel, Feature Usage.
- **Settings**: read-only Payment Settings and Billing Settings pages under the existing
  `app/settings/` tree.

## 6. Permissions

| Code | Roles | Scope |
|---|---|---|
| `platform.billing.manage` | `SUPER_ADMIN` only | Every `/platform/**` page and platform-staff action |
| `billing.subscription.manage` | `SUPER_ADMIN`, `SCHOOL_ADMIN` | A school's own subscribe/renew/upgrade/cancel |
| `billing.invoice.view` | `SUPER_ADMIN`, `SCHOOL_ADMIN` | A school's own invoices/payments/receipts |

`SCHOOL_ADMIN` is never granted `platform.billing.manage` — verified as an explicit, deliberate
security boundary, not a formality, since a lapse there would let one tenant's admin see or act on
another tenant's data.

## 7. Reports

Collection Report (by gateway provider, date range), Outstanding Report (by tenant, descending),
Monthly Revenue Report (12-month bucketed), Billing Dashboard (MRR, subscription counts,
outstanding/collected/overdue) — all platform-wide, all reusing the cross-tenant
direct-`prisma`-client pattern `BillingRun` itself established in Bundle A.

## 8. Notifications

`SUBSCRIPTION_ALERT` (new `NotificationType` value) dispatched to every `SCHOOL_ADMIN` of the
affected tenant for: Renewal Reminder (7 days before period end), Grace Reminder (daily while
`PAST_DUE`), Expiry Reminder (final 2 days of the grace period). Routed entirely through the
pre-existing `dispatchNotification`/`NotificationQueue` machinery — no parallel system was built.

## 9. Tests

928/928 passing project-wide at final verification. `modules/billing` alone: 35 test files
covering DTO validation, pure business-rule helpers (GST calculation, payment and subscription
lifecycle transition tables, webhook signature/replay/idempotency, feature-entitlement
resolution, MRR month-normalization), repository `toEntity` mapper unit tests (the established
substitute for a mocked-repository framework, since none existed as precedent), and mocked
service-logic tests for every non-trivial branch (idempotent webhook redelivery, per-tenant
failure isolation in cross-tenant sweeps, already-suspended-tenant skip behavior, and more).

## 10. Build Result

Final, independently re-run verification (not solely trusted from any sub-agent report):

```
npx prisma validate        → valid
npx prisma migrate status  → up to date (18 migrations)
npm run lint                → clean
npm run typecheck           → clean, 0 errors
npm test                    → 928/928 passing (138 files)
npm run build                → succeeded, 239 routes (172 before Bundle E)
```

## 11. Architectural Notes

- **Three data tiers, a first for this codebase**: tenant-owned (`Subscription`,
  `SubscriptionInvoice`, `Payment` — standard RLS isolation), public catalog
  (`SubscriptionPlanDefinition`, `PlanFeatureEntitlement` — no `tenantId`, read-open/write-
  restricted), platform-operations (`BillingRun`, `WebhookEvent`, `PlatformInvoiceSequence`,
  `PlatformAuditLog` — no/nullable `tenantId`, service-role-only by design). Every prior phase
  needed only the first tier.
- **Append-only revision history, not in-place mutation**: `Subscription` mirrors
  `EmployeeSalaryAssignment`'s close-then-create discipline exactly — a plan change or renewal
  closes the current row and opens a new one, never edits price/plan/cycle in place. Lifecycle
  *status* transitions (Trial→Active→Grace→Expired) are the one sanctioned exception, a
  status-flip-in-place on the current row, mirroring how `cancel()` already worked before Bundle D
  generalized it.
- **Sanctioned exceptions to standing rules, both anticipated by CLAUDE.md, neither built until
  this phase actually needed them**: the webhook ingestion route is the one place in the codebase
  that would call into the application layer with no `requireAuthContext()` at all (its trust
  boundary is the HMAC signature instead) — note the route handler itself was never built in
  Bundle E (out of scope), only the ingestion *service* `ingestRazorpayWebhook` that a route would
  call; `modules/tenancy/infrastructure` (the RLS-bypass service-role client) was likewise
  anticipated but never built — every cross-tenant read in this phase used the plain `prisma`
  client directly instead, an interim, already-precedented pattern (`getCurrentTenant` established
  it back in Phase 1 for the same reason: `Tenant` has no `tenantId` column to scope by).
- **Domain-scoped enums over cross-domain reuse**: `PaymentStatus`, `SalaryPaymentMode`-style
  reasoning applied again — `SubscriptionInvoiceStatus`/`PaymentStatus`/`BillingRunStatus` were
  each built new rather than reusing structurally-similar `FeeInvoiceStatus`/`FeePaymentStatus`/
  `PayrollRunStatus`, to keep platform billing decoupled from school-fee billing and payroll.

## 12. Remaining Improvements (explicitly flagged, not silently deferred)

1. **No unattended recurring charging** — auto-renewal extends the period and generates the next
   invoice, but nothing in this schema stores a reusable payment mandate/token; actual collection
   still needs the tenant to pay or a future recurring-payment mechanism.
2. **`modules/tenancy/infrastructure` still doesn't exist** — every platform-wide read in this
   phase uses the plain `prisma` client as an interim measure; a future phase should build the
   real service-role-bypass boundary CLAUDE.md already reserves for this.
3. **No webhook route handler** — `ingestRazorpayWebhook` (the service) exists and is fully
   tested; the actual `app/api/webhooks/razorpay/route.ts` HTTP entry point that would call it was
   out of Bundle E's stated scope (no REST APIs) and was never built. Razorpay cannot currently
   reach this system.
4. **GST rate/inter-state determination is caller-supplied**, not auto-derived — no GSTIN or
   registered-state is stored per tenant.
5. **Three daily background jobs are callable but unscheduled** — no cron/scheduler infrastructure
   wires them up yet; explicitly deferred to "Phase 21" per this phase's own instructions.
6. **`Tenant.subscriptionPlan`/`subscriptionStatus` cache gap** (discovered during Bundle D, not
   fixed since it required touching a frozen Bundle A file): `createSubscription`/
   `cancelSubscription` never sync these denormalized cache fields on `Tenant`, though
   `transitionSubscriptionStatus` (Bundle D onward) does. Not an access-control bug — license
   checks read `Subscription.status`, the real source of truth — but the cache field is stale from
   those two paths and a naive future consumer reading `Tenant.subscriptionStatus` directly should
   be aware.
