// Own equivalent of modules/payroll/application/payroll-context.ts — deliberately not
// cross-imported, so modules/billing stays decoupled from every other module, mirroring how every
// other module owns its own Context type.
//
// Two contexts, not one, because this module straddles both tiers described in the module-level
// brief: BillingContext is for the tenant-owned services (Subscription, SubscriptionInvoice,
// Payment — RLS-scoped, always acting on behalf of one tenant). PlatformBillingContext is for the
// platform-ops services (SubscriptionPlanDefinition/PlanFeatureEntitlement catalog edits,
// BillingRun, WebhookEvent ingestion) — there is no tenantId to scope by, and `actingUserId` is
// nullable because a BillingRun can be processed by an unattended cron job with no human actor
// (mirrors PlatformAuditLogEntity.actorId's own nullability).
export interface BillingContext {
  tenantId: string;
  actingUserId: string;
}

export interface PlatformBillingContext {
  actingUserId: string | null;
}
