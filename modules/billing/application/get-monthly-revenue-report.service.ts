import "server-only";
import { prisma } from "@/lib/prisma";
import type { MonthlyRevenueReportDTO } from "./dto/billing-reports.dto";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Platform-wide — every CAPTURED payment (across every tenant) whose `capturedAt` falls in the
// given calendar year (UTC), bucketed by month. Reads the plain `prisma` client directly rather
// than through PaymentRepository, mirroring billing-run.service.ts's own cross-tenant precedent
// (see that file's own comment). Bucketing happens in application code rather than a DB-side
// `EXTRACT(MONTH FROM ...)` groupBy — Prisma's query builder has no date-part grouping primitive,
// and a year's worth of CAPTURED payments is a small, bounded result set to bucket in memory.
export async function getMonthlyRevenueReport(year: number): Promise<MonthlyRevenueReportDTO> {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const payments = await prisma.payment.findMany({
    where: {
      status: "CAPTURED",
      capturedAt: { gte: yearStart, lt: yearEnd },
    },
    select: { amount: true, capturedAt: true },
  });

  // All 12 months present even with sparse (or zero) activity — never sized to only the months
  // that actually had a payment.
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, revenue: 0, paymentCount: 0 }));

  for (const payment of payments) {
    if (!payment.capturedAt) continue;
    const monthIndex = payment.capturedAt.getUTCMonth();
    const bucket = months[monthIndex];
    bucket.revenue = round2(bucket.revenue + payment.amount.toNumber());
    bucket.paymentCount += 1;
  }

  return { year, months };
}
