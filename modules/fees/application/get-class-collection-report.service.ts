import "server-only";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { listFeeInvoices } from "./list-invoices.service";
import type { ClassCollectionReportDTO, ClassCollectionRowDTO } from "./dto/reports.dto";

// Class-wise Collection Report (requirement 20).
export async function getClassCollectionReport(
  tenantId: string,
  academicSessionId: string
): Promise<ClassCollectionReportDTO> {
  const invoices = await listFeeInvoices(tenantId, { academicSessionId });

  const byClass = new Map<string, { totalCollected: number; totalOutstanding: number }>();
  for (const invoice of invoices) {
    const entry = byClass.get(invoice.classId) ?? { totalCollected: 0, totalOutstanding: 0 };
    entry.totalCollected = Math.round((entry.totalCollected + invoice.amountPaid) * 100) / 100;
    if (invoice.status !== "CANCELLED" && invoice.balance > 0) {
      entry.totalOutstanding = Math.round((entry.totalOutstanding + invoice.balance) * 100) / 100;
    }
    byClass.set(invoice.classId, entry);
  }

  const classRepository = new PrismaClassRepository();
  const rows: ClassCollectionRowDTO[] = [];
  for (const [classId, totals] of byClass) {
    const classEntity = await classRepository.findById(tenantId, classId);
    rows.push({ classId, className: classEntity?.name ?? "Unknown", ...totals });
  }

  rows.sort((a, b) => a.className.localeCompare(b.className));

  return { academicSessionId, rows };
}
