import "server-only";
import { prisma } from "@/lib/prisma";
import type { CollectionReportDTO } from "./dto/billing-reports.dto";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Platform-wide — every CAPTURED payment (across every tenant) whose `capturedAt` falls in
// [fromDate, toDate], grouped by gateway provider. Reads the plain `prisma` client directly
// rather than through PaymentRepository, mirroring billing-run.service.ts's own cross-tenant
// precedent (see that file's own comment).
export async function getCollectionReport(fromDate: Date, toDate: Date): Promise<CollectionReportDTO> {
  const rows = await prisma.payment.groupBy({
    by: ["gatewayProvider"],
    where: {
      status: "CAPTURED",
      capturedAt: { gte: fromDate, lte: toDate },
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const byGatewayProvider = rows.map((row) => ({
    gatewayProvider: row.gatewayProvider,
    amount: round2(row._sum.amount?.toNumber() ?? 0),
    count: row._count._all,
  }));

  const totalCollected = round2(byGatewayProvider.reduce((sum, row) => sum + row.amount, 0));
  const paymentCount = byGatewayProvider.reduce((sum, row) => sum + row.count, 0);

  return {
    fromDate: toDateOnly(fromDate),
    toDate: toDateOnly(toDate),
    totalCollected,
    paymentCount,
    byGatewayProvider,
  };
}
