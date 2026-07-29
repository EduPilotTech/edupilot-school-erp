import "server-only";
import { listFeeInvoices } from "@/modules/fees/application/list-invoices.service";
import { PrismaRouteFeeRuleRepository } from "../infrastructure/prisma-route-fee-rule.repository";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import type { RouteFeeCollectionReportDTO, RouteFeeCollectionRowDTO } from "./dto/reports.dto";

// Transport Fee Collection Report — a thin filter over the existing Fee reporting pipeline
// (Phase 10 requirement 12), not new billing-report code: every transport charge is already a
// real FeeInvoice row (Decision 1), so this just groups the ones with routeFeeRuleId set by the
// route they bill for.
export async function getTransportFeeCollectionReport(
  tenantId: string,
  academicSessionId: string
): Promise<RouteFeeCollectionReportDTO> {
  const invoices = await listFeeInvoices(tenantId, { academicSessionId });
  const transportInvoices = invoices.filter((invoice) => invoice.routeFeeRuleId !== null);

  const ruleRepository = new PrismaRouteFeeRuleRepository();
  const rules = await ruleRepository.findByAcademicSession(tenantId, academicSessionId);
  const routeIdByRuleId = new Map(rules.map((rule) => [rule.id, rule.routeId]));

  const byRoute = new Map<string, { totalCollected: number; totalOutstanding: number }>();
  for (const invoice of transportInvoices) {
    const routeId = invoice.routeFeeRuleId ? routeIdByRuleId.get(invoice.routeFeeRuleId) : undefined;
    if (!routeId) continue;
    const entry = byRoute.get(routeId) ?? { totalCollected: 0, totalOutstanding: 0 };
    entry.totalCollected = Math.round((entry.totalCollected + invoice.amountPaid) * 100) / 100;
    if (invoice.status !== "CANCELLED" && invoice.balance > 0) {
      entry.totalOutstanding = Math.round((entry.totalOutstanding + invoice.balance) * 100) / 100;
    }
    byRoute.set(routeId, entry);
  }

  const routeRepository = new PrismaRouteRepository();
  const rows: RouteFeeCollectionRowDTO[] = [];
  for (const [routeId, totals] of byRoute) {
    const route = await routeRepository.findById(tenantId, routeId);
    rows.push({ routeId, routeName: route?.name ?? "Unknown", ...totals });
  }

  rows.sort((a, b) => a.routeName.localeCompare(b.routeName));

  return { academicSessionId, rows };
}
