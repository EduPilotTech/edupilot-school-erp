import "server-only";
import { prisma } from "@/lib/prisma";
import type { OutstandingReportDTO } from "./dto/billing-reports.dto";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Platform-wide — every outstanding invoice (ISSUED/PARTIALLY_PAID/OVERDUE, across every tenant),
// grouped by tenant and ordered by outstandingAmount descending. Reads the plain `prisma` client
// directly rather than through SubscriptionInvoiceRepository, mirroring billing-run.service.ts's
// own cross-tenant precedent (see that file's own comment).
export async function getOutstandingReport(): Promise<OutstandingReportDTO> {
  const rows = await prisma.subscriptionInvoice.groupBy({
    by: ["tenantId"],
    where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  const byTenant = rows
    .map((row) => ({
      tenantId: row.tenantId,
      outstandingAmount: round2(row._sum.totalAmount?.toNumber() ?? 0),
      invoiceCount: row._count._all,
    }))
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount);

  const totalOutstanding = round2(byTenant.reduce((sum, row) => sum + row.outstandingAmount, 0));
  const invoiceCount = byTenant.reduce((sum, row) => sum + row.invoiceCount, 0);

  return { totalOutstanding, invoiceCount, byTenant };
}
