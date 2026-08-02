// Platform-wide operational snapshot for EduPilot's own billing dashboard (not a per-tenant
// view) — composed by billing-dashboard.service.ts from direct cross-tenant `prisma` reads,
// mirroring billing-run.service.ts's own precedent for this module's platform-ops tier.
export interface BillingDashboardDTO {
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  // Monthly Recurring Revenue — sum of every current (effectiveTo: null), ACTIVE subscription's
  // `priceAtAssignment`, with ANNUAL-cycle subscriptions normalized to a monthly figure
  // (priceAtAssignment / 12) before summing alongside MONTHLY-cycle figures as-is.
  monthlyRecurringRevenue: number;
  outstandingInvoicesCount: number;
  // Simple sum of `totalAmount` across outstanding invoices (ISSUED/PARTIALLY_PAID/OVERDUE) — a
  // "current state" figure, not net of any partial payments already applied to those invoices
  // (no partial-payment-aware net figure is cleanly derivable from the schema without allocations,
  // unlike modules/fees; see billing-dashboard.service.ts's own comment).
  outstandingAmount: number;
  // Gross CAPTURED payment amount this calendar month (UTC) — not netted against refunds issued
  // in the same window; see billing-dashboard.service.ts's own comment for the reasoning.
  collectedThisMonth: number;
  // OVERDUE-status invoices, plus ISSUED/PARTIALLY_PAID invoices whose dueDate has already
  // passed but whose stored status hasn't been flipped yet (see isEffectivelyOverdue in
  // list-tenant-invoices.service.ts — the schema has no scheduled job to do that flip).
  overdueInvoicesCount: number;
}
