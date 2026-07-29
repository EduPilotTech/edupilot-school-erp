import "server-only";
import { PrismaFeePaymentRepository } from "../infrastructure/prisma-fee-payment.repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import type { DailyCollectionReportDTO, DailyCollectionReportRowDTO } from "./dto/reports.dto";
import type { FeePaymentModeValue } from "../domain/fee-payment.entity";

const PAYMENT_MODES: FeePaymentModeValue[] = ["CASH", "CHEQUE", "UPI", "CARD", "BANK_TRANSFER", "ONLINE"];

// Daily Collection Report (requirement 18) — every COMPLETED payment recorded on the given
// calendar date, grouped by payment mode. Reversed/cancelled payments are excluded — they never
// represent cash actually retained on that day.
export async function getDailyCollectionReport(
  tenantId: string,
  academicSessionId: string,
  date: string
): Promise<DailyCollectionReportDTO> {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);

  const paymentRepository = new PrismaFeePaymentRepository();
  const payments = await paymentRepository.findByDateRange(tenantId, academicSessionId, from, to);
  const completed = payments.filter((payment) => payment.status === "COMPLETED");

  const studentRepository = new PrismaStudentRepository();
  const studentNameCache = new Map<string, string>();

  const totalsByMode = Object.fromEntries(PAYMENT_MODES.map((mode) => [mode, 0])) as Record<
    FeePaymentModeValue,
    number
  >;
  let totalCollected = 0;
  const rows: DailyCollectionReportRowDTO[] = [];

  for (const payment of completed) {
    let studentName = studentNameCache.get(payment.studentId);
    if (!studentName) {
      const student = await studentRepository.findById(tenantId, payment.studentId);
      studentName = student ? `${student.firstName} ${student.lastName}` : "Unknown";
      studentNameCache.set(payment.studentId, studentName);
    }

    totalsByMode[payment.paymentMode] = Math.round((totalsByMode[payment.paymentMode] + payment.amount) * 100) / 100;
    totalCollected = Math.round((totalCollected + payment.amount) * 100) / 100;

    rows.push({
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      studentId: payment.studentId,
      studentName,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      collectedBy: payment.collectedBy,
      paidAt: payment.paidAt.toISOString(),
    });
  }

  return { date, totalCollected, totalsByMode, rows };
}
