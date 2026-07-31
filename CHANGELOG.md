# Changelog

All notable changes to EduPilot School ERP are documented in this file.

## [v0.15.0] — Communication Hub

Extends the existing Phase 9 notification foundation (`Notification`/`NotificationDelivery`/
`NotificationSender`) — does not duplicate or replace it. Every module that already dispatches
notifications (Library, Hostel, HR, Payroll, Transport) is unaffected.

### Added
- **Notification Templates**: per-channel message templates (Email/SMS/WhatsApp/In-App) with
  named `{{variable}}` placeholders, rendered at send time. Full CRUD, one template per
  (name, channel) pair.
- **Notification Queue**: a scheduling/retry wrapper around the existing `Notification` record —
  `queue()`/`send()`/`schedule()`/`retry()`/`cancel()`. A notification can be dispatched
  immediately, deferred to a future time, or retried after a failure without ever creating a
  duplicate record for the same logical message.
- **Queue Engine**: `processQueueEntry`/`processDueNotificationQueue` — the shared dispatch loop
  (also now used by the original `dispatchNotification()` helper, refactored to share it rather
  than duplicate it) that fans a notification out to every active channel sender and records one
  delivery attempt per channel.
- **Template Engine**: pure `{{variable}}` substitution, unit-tested independently of any
  database or provider.
- **Provider Interfaces**: `EmailProvider` (`sendMail`, `sendAttachment`), `SMSProvider`
  (`sendSMS`), `WhatsAppProvider` (`sendMessage`, `sendTemplate`, `sendMedia`) — TypeScript
  contracts only, each with a stub implementation that honestly reports "not configured" rather
  than a real integration. No SMTP, SMS gateway, WhatsApp Business API, or other external service
  is called this release.
- **Communication Dashboard**: Today's Notifications, Queued, Delivered, Failed, Pending.
- **Notification Reports**: Notification Report, Delivery Report (with status-count summary),
  Failed Notifications Report.
- **RBAC**: `notification.view`, `notification.manage`, `template.manage`,
  `communication.manage` — Admin-only management; `notification.view` additionally granted to
  Principal for oversight.
- **Tests**: DTO validation for `NotificationTemplate` and `NotificationQueue`, plus a dedicated
  suite for the pure template-rendering helper. 480/480 tests passing project-wide.
- **Build**: `prisma validate`, migration status, lint, typecheck, tests, and production build all
  pass clean.

### Fixed
- A recipient-resolution bug caught during this release's own review, before shipping: the new
  Email/SMS/WhatsApp channel senders resolved a notification's recipient via an unscoped lookup
  rather than the tenant-scoped convention every other query in this codebase follows. Fixed by
  adding `tenantId` to the shared `NotificationSender` dispatch contract.

## [v0.14.0] — Finance & Accounts

A simple cash/bank ledger for private schools — not a double-entry accounting engine. No
GST/VAT/TDS, no Journal Vouchers, no Purchase Orders, no Asset Depreciation, no Budget module,
no multi-currency, no complex tax engine.

### Added
- **Database**: `FinanceAccount` (CASH/BANK, opening/current balance, single-default-account
  invariant), `IncomeCategory` and `ExpenseCategory` (school-scoped lookup tables), `Income` and
  `Expense` (tenant + academic-session-scoped transaction records, soft-deleted, created/updated
  by). `FinanceAccount.currentBalance` is maintained transactionally on every Income/Expense
  create/update/delete via a pure, unit-tested balance-delta helper — never recomputed by summing
  history on read.
- **Finance Accounts**: create/update/deactivate bank and cash accounts; opening balance sets the
  starting running balance; only one account may be marked default at a time.
- **Income & Expense**: full CRUD against a Category, a Finance Account, and an Academic Session,
  with amount/date/description/reference number (Income also records who collected it; Expense
  also records vendor and payment mode).
- **Income Categories & Expense Categories**: admin-managed master data (Admission Fee, Tuition
  Fee, Transport Fee, Hostel Fee, Exam Fee, Library Fee, Donation, Misc Income / Salary, Electric
  Bill, Internet, Office Expense, Maintenance, Stationery, Marketing, Cleaning, Transport, Misc
  Expense are seeded as illustrative starting categories, not hardcoded).
- **Finance Dashboard**: Today's Income, Today's Expense, Monthly Income, Monthly Expense, Current
  Cash Balance, Current Bank Balance — one composed read.
- **Reports**: Income Report, Expense Report, Category-wise Income, Category-wise Expense, and a
  12-month Monthly Summary — each filterable by date range, category, and academic session.
- **Export**: Print, PDF (client-side, reusing the existing jsPDF + html-to-image stack already
  used for Fee receipts and Payslips), and CSV — no server round-trip, no new dependency added for
  export.
- **RBAC**: `finance.master.manage`, `finance.income.manage`, `finance.expense.manage`,
  `finance.report.view` — granted to Admin, the existing Accountant role, and (report viewing
  only) Principal. No new role was needed.
- **Tests**: DTO validation tests for every new schema, plus a dedicated business-logic test suite
  for the balance-delta helper (record/update/delete adjustment math, including the reversal path
  when an entry's amount or account changes).

### Security note
Excel export was deliberately implemented as CSV rather than a real `.xlsx` file: the only
`xlsx`-writing package published on the npm registry carries two unpatched high-severity
CVEs (prototype pollution, ReDoS). It was evaluated, found vulnerable, and removed. CSV opens
natively in Excel, Sheets, and Numbers and requires no dependency.

## [Unreleased] — v0.4.0-user-management

### Added
- Core Foundation Prisma models unaffected — no schema changes this release.
- **User Management domain module** (`modules/users/`): `UserProfile`/`Role`/`UserRole` repositories (domain interfaces + Prisma implementations), following the established Repository Pattern.
- **Application services**: invite user, accept invitation, update profile, suspend/activate/deactivate, soft delete/restore, assign/remove role, plus read-only list/detail queries for the UI.
- **Server Actions** (`app/settings/users/actions.ts`): thin action layer — resolve `AuthContext`, check the relevant permission, delegate to the application service. No business logic in the action layer itself.
- **User Administration UI** (`app/settings/users/`): Users List (search/status filter/role filter/pagination), User Details (profile, roles, status actions, metadata), Invite User, Edit User — Server Components by default, Client Components only for forms/dialogs/confirmations.
- **Seed script** (`prisma/seed.ts`): System Roles (Super Admin, School Admin, Principal, Vice Principal, Teacher, Class Teacher, Accountant, Receptionist, Librarian, Parent, Student), the 9 permission codes this release actually uses, and `RolePermission` grants (Super Admin + School Admin only). No customer data.

### Fixed
- **Authentication:** `requireCurrentUser()` (`lib/auth/current-user.ts`) previously only checked that a `UserProfile` existed — it did not verify `status`/`deletedAt`, meaning a suspended, inactive, or soft-deleted user with a still-valid Supabase session could pass straight through to every downstream helper (`getCurrentTenant`, `getCurrentSchool`, `requireAuthContext`, and therefore `getAuthorizationContext`/`requirePermission`/`requireRole`). Fixed centrally, once, in `requireCurrentUser()` — no duplicated checks elsewhere.
- **Authorization:** `resolvePermissions()` (`lib/auth/rbac.ts`) queried `UserRole` filtered only by `userId`, not `tenantId` — inconsistent with every other tenant-scoped query in the codebase, which explicitly filters by `tenantId` rather than relying solely on foreign-key integrity. Not independently exploitable (the FK already guarantees `userId`'s rows share one `tenantId`), but fixed for consistency with the established defense-in-depth convention.
- **Role assignment:** `assignRole()` had no protection against a user granting *themselves* a new protected/administrative role — the mirror image of `removeRole`'s existing "cannot remove your own last administrative role" check, which had no counterpart on the assignment side. Fixed: assigning a protected role to yourself is now blocked, matching `removeRole`'s existing scope and rationale.

### Known Limitations (carried forward, not regressions)
- `AuditLog` does not exist yet — every audit event this release's services reference is a `TODO(audit)` comment at the correct integration point, not a live log.
- Row Level Security policies and the first Prisma migration have not been created — this release's tenant isolation is enforced entirely at the application/repository layer (explicit `tenantId` scoping), not yet backed by a database-level policy.
- The seed script cannot be executed against a real database yet, for the same reason (no migration exists to create the tables it seeds against).
- "Cannot assign role across tenants" for role removal already existed; the equivalent for *reassignment race conditions* (two concurrent assignments) is not specifically tested, relying on the database's `(userId, roleId)` unique constraint as the final backstop.

## [v0.3.0-auth] — Authentication Foundation
Supabase authentication infrastructure (browser/server/admin clients), `proxy.ts` session refresh and route-group redirects, session/tenant/school resolution with request-scoped caching, `lib/prisma/tenant-context.ts`, RBAC permission resolution and authorization helpers, and sign-in/sign-out/forgot-password application services.

## [v0.2.1-marketing] — Marketing Landing Page
Production-grade enterprise landing page redesign (`app/page.tsx`).

## [v0.2.0-rbac] — Enterprise RBAC Foundation
`Role`, `Permission`, `RolePermission`, `UserProfile`, `UserRole` Prisma models — nullable-tenant System/Custom role scoping, composite foreign keys for tenant-integrity guarantees, and the full design/review cycle documented across Sprint 1B.

## [v0.1.0-foundation] — Core Foundation
`Tenant`, `School`, `AcademicSession` Prisma models; Prisma 7 + Supabase infrastructure (`lib/prisma.ts`, `lib/supabase/*`); project documentation set (`docs/`, `CLAUDE.md`).
