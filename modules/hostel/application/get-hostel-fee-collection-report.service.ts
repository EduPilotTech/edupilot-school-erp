import "server-only";
import { listFeeInvoices } from "@/modules/fees/application/list-invoices.service";
import { PrismaHostelFeeRuleRepository } from "../infrastructure/prisma-hostel-fee-rule.repository";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import type { HostelFeeCollectionReportDTO, HostelFeeCollectionRowDTO } from "./dto/reports.dto";

// Hostel Fee Collection Report — a thin filter over the existing Fee reporting pipeline (reuse
// Phase 8, per this phase's explicit instruction not to build a new billing report): every
// hostel charge is already a real FeeInvoice row (hostelFeeRuleId set), so this just groups the
// ones for this session by the hostel each rule bills for.
export async function getHostelFeeCollectionReport(
  tenantId: string,
  academicSessionId: string
): Promise<HostelFeeCollectionReportDTO> {
  const invoices = await listFeeInvoices(tenantId, { academicSessionId });
  const hostelInvoices = invoices.filter((invoice) => invoice.hostelFeeRuleId !== null);

  const ruleRepository = new PrismaHostelFeeRuleRepository();
  const rules = await ruleRepository.findByAcademicSession(tenantId, academicSessionId);
  const hostelIdByRuleId = new Map(rules.map((rule) => [rule.id, rule.hostelId]));

  const byHostel = new Map<string, { totalCollected: number; totalOutstanding: number }>();
  for (const invoice of hostelInvoices) {
    const hostelId = invoice.hostelFeeRuleId ? hostelIdByRuleId.get(invoice.hostelFeeRuleId) : undefined;
    if (!hostelId) continue;
    const entry = byHostel.get(hostelId) ?? { totalCollected: 0, totalOutstanding: 0 };
    entry.totalCollected = Math.round((entry.totalCollected + invoice.amountPaid) * 100) / 100;
    if (invoice.status !== "CANCELLED" && invoice.balance > 0) {
      entry.totalOutstanding = Math.round((entry.totalOutstanding + invoice.balance) * 100) / 100;
    }
    byHostel.set(hostelId, entry);
  }

  const hostelRepository = new PrismaHostelRepository();
  const rows: HostelFeeCollectionRowDTO[] = [];
  for (const [hostelId, totals] of byHostel) {
    const hostel = await hostelRepository.findById(tenantId, hostelId);
    rows.push({ hostelId, hostelName: hostel?.name ?? "Unknown", ...totals });
  }

  rows.sort((a, b) => a.hostelName.localeCompare(b.hostelName));

  return { academicSessionId, rows };
}
