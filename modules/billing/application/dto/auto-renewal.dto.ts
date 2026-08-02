// Phase 16, Bundle D Part Two, Step 2 — see auto-renewal.service.ts's own module comment for the
// honest limitation this DTO's result represents: a successful entry in `renewedTenantIds` means
// the subscription's period was extended and its next invoice was generated, NOT that a payment
// was collected end-to-end without human/gateway interaction.
export interface AutoRenewalResultDTO {
  processed: number;
  renewedTenantIds: string[];
  failedTenantIds: string[];
}
