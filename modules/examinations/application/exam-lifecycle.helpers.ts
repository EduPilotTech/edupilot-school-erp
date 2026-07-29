import type { ExamStatusValue } from "../domain/exam.entity";

// Pure, no "server-only" import — deliberately unit-testable in isolation, same reasoning as
// period-validation.helpers.ts/grade-band-validation.helpers.ts. Phase 7 Decision 8's lifecycle
// is a strict, one-step-forward chain — no skipping ahead, no going back. Each index is the only
// legal "next" status for the one before it.
const LIFECYCLE_ORDER: ExamStatusValue[] = [
  "DRAFT",
  "SCHEDULED",
  "ONGOING",
  "MARKS_ENTRY_COMPLETED",
  "RESULT_GENERATED",
  "RESULT_PUBLISHED",
];

// The one legal next status after `current`, or null if `current` is already the final status —
// used by ExamStatusControl (a Client Component; this file has no "server-only" import, so it's
// safe to bundle client-side) to label its "Advance to X" button without duplicating
// LIFECYCLE_ORDER.
export function getNextStatus(current: ExamStatusValue): ExamStatusValue | null {
  const index = LIFECYCLE_ORDER.indexOf(current);
  return index >= 0 && index < LIFECYCLE_ORDER.length - 1 ? LIFECYCLE_ORDER[index + 1] : null;
}

// Returns an error message if the transition is illegal, or null if it's allowed.
export function validateStatusTransition(from: ExamStatusValue, to: ExamStatusValue): string | null {
  const fromIndex = LIFECYCLE_ORDER.indexOf(from);
  const toIndex = LIFECYCLE_ORDER.indexOf(to);

  if (toIndex !== fromIndex + 1) {
    return `Cannot move an exam from ${from} to ${to} — it must advance one step at a time, in order (${LIFECYCLE_ORDER.join(" → ")}).`;
  }
  return null;
}

// Whether an action gated to a specific status (e.g. marks entry requires ONGOING) is currently
// allowed.
export function requiresStatus(current: ExamStatusValue, required: ExamStatusValue): string | null {
  if (current !== required) {
    return `This action requires the exam to be ${required}, but it is currently ${current}.`;
  }
  return null;
}

// Whether an action gated to one of several statuses (e.g. adding an ExamSubject is allowed
// while still setting up the exam) is currently allowed.
export function requiresOneOfStatuses(current: ExamStatusValue, allowed: ExamStatusValue[]): string | null {
  if (!allowed.includes(current)) {
    return `This action requires the exam to be one of [${allowed.join(", ")}], but it is currently ${current}.`;
  }
  return null;
}
