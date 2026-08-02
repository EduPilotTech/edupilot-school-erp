import type { AutoRenewalResultDTO } from "./auto-renewal.dto";

// Phase 16, Bundle D Part Two, Step 4 — result shapes for the three named daily background jobs a
// future scheduler (Phase 21) will call once per day. Each job is self-contained and safe to
// re-run: a subscription already moved out of the originating status on a prior run is simply not
// a candidate the next time the sweep runs.

export interface DailyValidationResultDTO {
  validated: number;
  movedToExpired: string[];
  movedToGracePeriod: string[];
  failed: string[];
}

export interface DailyExpiryResultDTO {
  movedToExpired: string[];
  suspendedTenantIds: string[];
  graceRemindersSent: number;
  expiryRemindersSent: number;
  failed: string[];
}

export interface DailyRenewalResultDTO {
  renewalRemindersSent: number;
  autoRenewalResult: AutoRenewalResultDTO;
}
