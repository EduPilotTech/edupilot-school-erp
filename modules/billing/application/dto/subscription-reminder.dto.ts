// Phase 16, Bundle D Part Two, Step 1 — see subscription-reminder.service.ts's own module comment
// for the candidate-DETECTION-only scope boundary this DTO serves (no notification is dispatched
// for these candidates in this bundle).
export type ReminderTypeValue = "RENEWAL" | "GRACE" | "EXPIRY";

export interface ReminderCandidateDTO {
  tenantId: string;
  subscriptionId: string;
  reminderType: ReminderTypeValue;
  // ISO date (YYYY-MM-DD) — the subscription's own `currentPeriodEnd`, for the caller's own
  // context/display; NOT the reminder's own boundary date (see `daysRemaining` below).
  currentPeriodEnd: string;
  // Whole days between `asOf` and the reminder's own relevant boundary date: for RENEWAL, that
  // boundary is `currentPeriodEnd` itself; for GRACE/EXPIRY, it is the grace period's own end
  // (`currentPeriodEnd + GRACE_PERIOD_DAYS`). Positive means the boundary is still ahead of `asOf`;
  // negative means it has already passed (possible for GRACE, whose predicate does not itself
  // bound how far past the grace period a still-PAST_DUE subscription can be found).
  daysRemaining: number;
}
