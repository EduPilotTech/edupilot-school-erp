import "server-only";
import { prisma } from "@/lib/prisma";
import { isEffectivelyOverdue } from "./list-tenant-invoices.service";
import type { BillingDashboardDTO } from "./dto/billing-dashboard.dto";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Start of the current calendar month in UTC (inclusive) and start of the next one (exclusive) —
// same UTC-anchored day-boundary discipline as get-hr-dashboard.service.ts's own `startOfDay`.
function currentMonthRangeUtc(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

// Platform-wide operational snapshot — EduPilot's own view across every tenant, not one school's
// view, so this reads the plain `prisma` client directly rather than through the tenant-scoped
// repository interfaces, mirroring billing-run.service.ts's own precedent for exactly this reason
// (`processBillingRun`'s `prisma.tenant.findMany(...)` call).
export async function getBillingDashboard(): Promise<BillingDashboardDTO> {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = currentMonthRangeUtc(now);

  const [statusCounts, activeSubscriptions, outstandingInvoices, collectedThisMonth] = await Promise.all([
    // Current (effectiveTo: null) subscriptions, grouped by status.
    prisma.subscription.groupBy({
      by: ["status"],
      where: { effectiveTo: null },
      _count: { _all: true },
    }),
    // Current + ACTIVE subscriptions' own price/cycle, to compute MRR (see the normalization
    // comment below — this can't be done as a DB-side `_sum` because ANNUAL rows need dividing
    // by 12 before summing, row by row).
    prisma.subscription.findMany({
      where: { effectiveTo: null, status: "ACTIVE" },
      select: { priceAtAssignment: true, billingCycle: true },
    }),
    // Every outstanding invoice's status/dueDate/totalAmount in one query — serves
    // outstandingInvoicesCount, outstandingAmount, AND overdueInvoicesCount below, rather than
    // three separate round-trips.
    prisma.subscriptionInvoice.findMany({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      select: { status: true, dueDate: true, totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", capturedAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const countFor = (status: "ACTIVE" | "TRIALING" | "PAST_DUE") =>
    statusCounts.find((row) => row.status === status)?._count._all ?? 0;

  // MRR normalization: an ANNUAL subscription's `priceAtAssignment` is a yearly figure, so it's
  // divided by 12 before joining MONTHLY-cycle figures (which are already a monthly figure) in
  // the same sum. Summing every subscription's raw `priceAtAssignment` without this normalization
  // would silently overstate MRR by up to 12x for every annual-plan tenant.
  const monthlyRecurringRevenue = round2(
    activeSubscriptions.reduce((sum, subscription) => {
      const price = subscription.priceAtAssignment.toNumber();
      const monthlyEquivalent = subscription.billingCycle === "ANNUAL" ? price / 12 : price;
      return sum + monthlyEquivalent;
    }, 0)
  );

  // Simple sum of `totalAmount` across outstanding invoices — a "current state" figure, not net
  // of any partial payments already applied to those invoices. A partial-payment-aware net figure
  // would require summing this module's own Payment rows per invoice and isn't cleanly derivable
  // without that extra join, so this documents the simpler, current-state interpretation per the
  // task brief rather than guessing at a netting rule.
  const outstandingAmount = round2(
    outstandingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount.toNumber(), 0)
  );

  const overdueInvoicesCount = outstandingInvoices.filter((invoice) =>
    isEffectivelyOverdue(invoice.status, invoice.dueDate, now)
  ).length;

  // Gross CAPTURED amount this month — NOT netted against refunds issued in the same window.
  // A payment captured this month and later (partially or fully) refunded still counts toward
  // `collectedThisMonth` in full; refunds are surfaced separately via getRefundHistory /
  // getCollectionReport's own CAPTURED-only scope. This mirrors "money that came in" rather than
  // a net-revenue figure, since netting refunds would require deciding which month a refund
  // "belongs" to (the capture month or the refund month) — a policy choice out of this bundle's
  // scope.
  const collectedThisMonthAmount = round2(collectedThisMonth._sum.amount?.toNumber() ?? 0);

  return {
    activeSubscriptions: countFor("ACTIVE"),
    trialingSubscriptions: countFor("TRIALING"),
    pastDueSubscriptions: countFor("PAST_DUE"),
    monthlyRecurringRevenue,
    outstandingInvoicesCount: outstandingInvoices.length,
    outstandingAmount,
    collectedThisMonth: collectedThisMonthAmount,
    overdueInvoicesCount,
  };
}
