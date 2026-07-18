# EduPilot School ERP — Phase Roadmap & Status

This document is the single source of truth for "what phase are we in." Update it in the same PR
that completes a milestone — it must never lag more than one merged PR behind reality.

**Last updated:** 2026-07-18
**Current phase:** Phase 0 — Enterprise Project Foundation (**in progress**)

---

## Phase 0 — Enterprise Project Foundation

**Goal:** establish architecture, tooling, and documentation before any ERP business module is
implemented.

| Task | Status |
|---|---|
| `docs/` created with architecture, standards, security, and process documentation | ✅ Done |
| `CLAUDE.md` updated with AI assistant instructions | ✅ Done |
| Prisma installed, `prisma/schema.prisma` initialized (`Tenant`, `User` models) | ⬜ Not started |
| Supabase project connected, `lib/supabase/{client,server,admin}.ts` split out | ⬜ Not started |
| RLS enabled + policy pattern proven on one table | ⬜ Not started |
| `proxy.ts` created (session refresh + tenant resolution) — replaces the deprecated `middleware.ts` convention | ⬜ Not started |
| `lib/prisma/tenant-context.ts` (transaction-scoped `set_config` helper) | ⬜ Not started |
| `lib/container.ts` dependency wiring scaffold | ⬜ Not started |
| `lib/errors.ts` domain error types | ⬜ Not started |
| CI pipeline: `tsc --noEmit`, lint, migrations against ephemeral DB | ⬜ Not started |
| `tsconfig.json` confirmed strict mode (already `"strict": true`) | ✅ Done (pre-existing) |

**Exit criteria:** a developer can run a Prisma-backed query through the repository pattern,
scoped by `tenant_id`, enforced by an RLS policy, from a single reference table — without any
ERP business module existing yet.

---

## Phase 1 — Auth & Tenancy

**Depends on:** Phase 0 complete.

- Sign-up provisions a `Tenant` + first `SCHOOL_ADMIN` user.
- Sign-in/sign-out via Supabase Auth + `@supabase/ssr`.
- `lib/auth/session.ts` (`getSession`, `requireSession`) and `lib/auth/rbac.ts` (`can()`)
  implemented and used consistently.
- Tenant settings page (school profile).

**Status:** ⬜ Not started.

## Phase 2 — Academic Structure + Teachers

**Depends on:** Phase 1 complete.

- `AcademicYear`, `Class`, `Section` CRUD.
- `Teacher` module built end-to-end (repository → service → Server Action → UI) as the reference
  implementation other business modules copy.

**Status:** ⬜ Not started.

## Phase 3 — Students & Parents

**Depends on:** Phase 2 complete (students enroll into classes/sections).

- `Student` CRUD + enrollment flow.
- `Parent`/guardian linkage, parent portal read access scoped by RLS to their own children.

**Status:** ⬜ Not started.

## Phase 4 — Attendance

**Depends on:** Phase 3 complete.

- Daily attendance marking UI, attendance-window and duplicate-prevention business rules.
- First reporting queries (attendance % by class/date range).

**Status:** ⬜ Not started.

## Phase 5 — Dashboard & Reporting

**Depends on:** Phases 2–4 complete (aggregates real data, not mocks).

- Per-role dashboards (admin / teacher / parent).

**Status:** ⬜ Not started.

## Phase 6 — Hardening & Launch Readiness

- Audit log UI, notifications/email, billing/plan limits (if applicable), RLS performance/load
  testing, security review, full E2E suite across enrollment → attendance → reporting.

**Status:** ⬜ Not started.

---

## How to update this document

- Flip a checklist item from ⬜ to ✅ only when it is merged into `main`, not when it is "in
  review."
- When a phase's exit criteria are fully met, mark the phase header status and move "Current
  phase" at the top of this document to the next phase.
- If scope changes mid-phase (a task is added, split, or dropped), edit the table directly —
  this document reflects current reality, not the original plan history (git history already
  preserves that).
