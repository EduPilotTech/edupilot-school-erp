# EduPilot School ERP — Coding Standards

## 1. TypeScript Strict Mode

`tsconfig.json` has `"strict": true` — this must never be weakened. Additional rules:

- No `any`. Use `unknown` + narrowing, a proper generic, or a documented Zod-inferred type.
- No `// @ts-ignore` or `// @ts-expect-error` without an inline comment explaining why and,
  ideally, a linked issue to remove it.
- No non-null assertions (`!`) except in the two already-established cases: reading required
  environment variables in `lib/supabase/*.ts` at module init, and in test fixtures. Anywhere else,
  narrow with an explicit check and throw a typed error.
- Prefer `interface` for object shapes that represent entities/DTOs; prefer `type` for unions,
  intersections, and utility/mapped types.
- Every function that crosses a module boundary (application service, repository method,
  Server Action) has an explicit return type — do not rely on inference across boundaries.

## 2. Naming Conventions

See [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md) §2 for the full file/entity naming table. In
code specifically:

- Variables/functions: `camelCase`. Classes/types/interfaces/components: `PascalCase`.
  Constants that are truly fixed (not config): `SCREAMING_SNAKE_CASE`.
- Boolean variables/props read as a predicate: `isActive`, `hasGuardian`, `canEdit` — not `active`,
  `guardian`, `edit`.
- Async functions that perform a side effect are named with a verb: `createStudent`, not
  `studentCreation`.
- Avoid abbreviations that aren't domain-standard (`tenantId` not `tId`; `attendance` not `att`).

## 3. React / Next.js Conventions

- **Server Components by default.** Add `"use client"` only when a component needs interactivity,
  browser APIs, or a React hook that requires the client (state, effects, event handlers).
- Data fetching happens in Server Components or Server Actions, never via `useEffect` + `fetch` for
  data that could be fetched server-side.
- Server Actions live in a colocated `actions.ts` per route segment (e.g.
  `app/(app)/students/actions.ts`), are marked `"use server"` at the top of the file, and contain
  **no business logic** — they call `requireSession()`, delegate to a `modules/*/application`
  service, and translate the result/error for the UI (see [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) §3).
- Props are typed with an explicit `interface <Component>Props`, not inline object types, once a
  component has more than one or two props.
- Co-locate a component's types with the component unless the type is shared across multiple
  components, in which case it belongs in `modules/<name>/application/dto/` or a shared `types/`
  location.

## 4. Validation

- Every Server Action and route handler validates its input with a Zod schema **before** calling
  into the application layer — the application service also re-validates (`schema.parse`, not
  `safeParse` silently ignored) as a defense-in-depth measure, since services must be safe to call
  from tests and future callers that might skip the delivery-layer validation.
- Zod schemas for a use case live next to the service that uses them, in
  `modules/<name>/application/dto/`, and the TypeScript type is inferred from the schema
  (`type CreateStudentInput = z.infer<typeof createStudentSchema>`) — never hand-write a duplicate
  interface alongside a Zod schema.

## 5. Error Handling

- Domain/application errors are typed classes defined in `lib/errors.ts`
  (`NotFoundError`, `BusinessRuleError`, `UnauthorizedError`, `ValidationError`) — application
  services throw these, never a bare `Error` or a string.
- Server Actions/route handlers catch these typed errors and map them to the appropriate
  response; they do not contain `if (error.message === "...")` string-matching.
- Never swallow an error silently (`catch {}` with no rethrow/log). If a failure is genuinely
  ignorable, say so with a comment explaining why.

## 6. Repository Pattern Rules

- A repository interface (`domain/<entity>.repository.ts`) declares methods only in terms of
  domain entities and primitive/DTO parameters — never a Prisma type in the interface signature.
- Every repository method's first parameter is `tenantId: string` (except methods that operate
  on genuinely tenant-global data, which must be justified in a comment).
- Repository implementations map Prisma models to domain entities via a colocated
  `<entity>.mapper.ts` — application code never touches a raw Prisma-generated type.
- Repositories contain no business rules — only persistence and query composition. If you find
  yourself writing an `if` that encodes a business decision inside a repository method, move it
  to the application service.

## 7. Testing Conventions

- `tests/unit/` — application services and domain logic, with repositories replaced by
  in-memory fakes implementing the same interface. No database, no network.
- `tests/integration/` — repository implementations run against a real (test/ephemeral) Postgres
  instance, including at least one test per table asserting RLS blocks cross-tenant access.
- `tests/e2e/` — Playwright, drives full user flows against a seeded tenant.
- Test file naming: `<subject>.test.ts` colocated under the matching `tests/` subfolder, mirroring
  the source path (`modules/students/application/enroll-student.service.ts` →
  `tests/unit/modules/students/enroll-student.service.test.ts`).
- A new application service is not complete without at least one test covering its primary
  business rule and one covering the authorization failure path.

## 8. Linting & Formatting

- ESLint (`eslint-config-next`) and the TypeScript compiler are both required to pass with zero
  errors before merge; warnings should be resolved, not suppressed with blanket disables.
- No disabling a lint rule repo-wide to fix a single violation — disable inline, on the specific
  line, with a short comment if the violation is a deliberate, justified exception.
- Formatting is automatic (Prettier defaults via the Next.js/ESLint setup) — do not hand-format
  against the tool's output.

## 9. Comments & Documentation in Code

- Default to no comments. Add one only when the *why* isn't obvious from the code itself — a
  non-obvious constraint, a workaround for a specific bug, an invariant a future editor could
  easily break.
- Do not restate what a well-named function/variable already communicates.
- Public application-service functions that encode a non-obvious business rule (e.g. capacity
  checks, attendance-window rules) get a one-line comment stating the rule, not a multi-paragraph
  docstring.
