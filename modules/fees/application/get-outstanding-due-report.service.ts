import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { listFeeInvoices } from "./list-invoices.service";
import type { OutstandingDueReportDTO, OutstandingDueRowDTO } from "./dto/reports.dto";

const OPEN_STATUSES = new Set(["PENDING", "PARTIALLY_PAID", "OVERDUE"]);

// Outstanding Due Report (requirement 19) — reuses listFeeInvoices so every row's balance already
// reflects the live fine computation (Decision 4), not a possibly-stale stored value.
export async function getOutstandingDueReport(
  tenantId: string,
  academicSessionId: string
): Promise<OutstandingDueReportDTO> {
  const invoices = await listFeeInvoices(tenantId, { academicSessionId });
  const openInvoices = invoices.filter((invoice) => OPEN_STATUSES.has(invoice.status) && invoice.balance > 0);

  const byStudent = new Map<string, { classId: string; totalOutstanding: number; overdueInvoiceCount: number }>();
  for (const invoice of openInvoices) {
    const entry = byStudent.get(invoice.studentId) ?? {
      classId: invoice.classId,
      totalOutstanding: 0,
      overdueInvoiceCount: 0,
    };
    entry.totalOutstanding = Math.round((entry.totalOutstanding + invoice.balance) * 100) / 100;
    if (invoice.status === "OVERDUE") entry.overdueInvoiceCount += 1;
    byStudent.set(invoice.studentId, entry);
  }

  const studentRepository = new PrismaStudentRepository();
  const classRepository = new PrismaClassRepository();
  const classNameCache = new Map<string, string>();

  const rows: OutstandingDueRowDTO[] = [];
  let totalOutstanding = 0;

  for (const [studentId, entry] of byStudent) {
    const student = await studentRepository.findById(tenantId, studentId);
    if (!student) continue;

    let className = classNameCache.get(entry.classId);
    if (!className) {
      const classEntity = await classRepository.findById(tenantId, entry.classId);
      className = classEntity?.name ?? "Unknown";
      classNameCache.set(entry.classId, className);
    }

    rows.push({
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      classId: entry.classId,
      className,
      totalOutstanding: entry.totalOutstanding,
      overdueInvoiceCount: entry.overdueInvoiceCount,
    });
    totalOutstanding = Math.round((totalOutstanding + entry.totalOutstanding) * 100) / 100;
  }

  rows.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  return { academicSessionId, totalOutstanding, rows };
}
