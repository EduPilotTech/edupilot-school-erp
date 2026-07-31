// Shared context type for modules/communication's Phase 15A application services
// (notification-template.service.ts, notification-queue.service.ts) — mirrors FinanceContext's/
// HrContext's own "one central file owns the type" pattern (see
// modules/finance/application/finance-context.ts) rather than each new service redeclaring an
// identical one-off Context interface, the way every pre-Phase-15A service in this module already
// does (CreateNoticeContext, CreateHomeworkContext, ...). Those existing per-service Context types
// are left as-is — this file is additive, for new services only.
export interface NotificationContext {
  tenantId: string;
  actingUserId: string;
}
