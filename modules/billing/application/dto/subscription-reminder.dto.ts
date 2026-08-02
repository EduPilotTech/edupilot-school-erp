// Phase 16, Bundle D Part Two, Step 2 — the result shape for each of the three reminder-dispatch
// sweeps (Renewal / Grace / Expiry) in subscription-reminder.service.ts. `candidateCount` is the
// total number of subscriptions the sweep's own pure predicate (see
// subscription-reminder.helpers.ts) matched, regardless of whether the notification for each one
// actually succeeded — `notifiedTenantIds`/`failedTenantIds` partition that same candidate set by
// outcome, mirroring BillingRun's own "generated vs skipped" reporting shape.
export interface ReminderDispatchResultDTO {
  candidateCount: number;
  notifiedTenantIds: string[];
  failedTenantIds: string[];
}
