import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaStudentAttendanceRepository } from "../infrastructure/prisma-student-attendance.repository";
import { countByStatus } from "./attendance-counts.helpers";
import {
  getStudentAttendanceReportSchema,
  type StudentAttendanceReportDTO,
  type StudentAttendanceReportEntry,
} from "./dto/attendance-report.dto";

export interface GetStudentAttendanceReportContext {
  tenantId: string;
}

// Student-wise Report: one student's day-by-day attendance history over a date range, plus
// aggregate counts. Unlike the Daily/Class-wise reports, this has no roster cross-reference —
// only days with an actual record are listed (no "Not Marked" placeholders per day).
export async function getStudentAttendanceReport(
  input: unknown,
  context: GetStudentAttendanceReportContext
): Promise<StudentAttendanceReportDTO> {
  const parsed = getStudentAttendanceReportSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid report request.");
  }
  const { studentId, startDate, endDate } = parsed.data;
  const { tenantId } = context;

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const records = await new PrismaStudentAttendanceRepository().findByStudentAndDateRange(
    tenantId,
    studentId,
    startDate,
    endDate
  );

  const entries: StudentAttendanceReportEntry[] = records.map((record) => ({
    date: record.date,
    status: record.status,
    remarks: record.remarks,
  }));

  return {
    studentId,
    startDate,
    endDate,
    entries,
    counts: countByStatus(records.map((record) => record.status)),
  };
}
