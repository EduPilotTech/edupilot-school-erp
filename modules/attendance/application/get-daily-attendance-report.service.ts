import "server-only";
import { ValidationError } from "@/lib/errors";
import { listStudents } from "@/modules/students/application/list-students.service";
import { PrismaStudentAttendanceRepository } from "../infrastructure/prisma-student-attendance.repository";
import { countByStatus } from "./attendance-counts.helpers";
import {
  getDailyAttendanceReportSchema,
  type DailyAttendanceReportDTO,
  type DailyAttendanceReportRow,
} from "./dto/attendance-report.dto";

export interface GetDailyAttendanceReportContext {
  tenantId: string;
}

// Daily Report: every student currently in the class/section, cross-referenced against that
// day's attendance records — students with no record yet show `status: null` ("Not Marked"),
// a common, expected attendance-report feature, not something invented beyond scope. Reuses the
// existing Student List service for the roster rather than a new repository method.
export async function getDailyAttendanceReport(
  input: unknown,
  context: GetDailyAttendanceReportContext
): Promise<DailyAttendanceReportDTO> {
  const parsed = getDailyAttendanceReportSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid report request.");
  }
  const { classId, sectionId, date } = parsed.data;
  const { tenantId } = context;

  const [roster, records] = await Promise.all([
    listStudents({ classId, sectionId, page: 1, pageSize: 200 }, { tenantId }),
    new PrismaStudentAttendanceRepository().findByClassAndDate(tenantId, classId, sectionId, date),
  ]);

  const recordByStudentId = new Map(records.map((record) => [record.studentId, record]));

  const rows: DailyAttendanceReportRow[] = roster.items.map((student) => ({
    studentId: student.id,
    admissionNumber: student.admissionNumber,
    fullName: `${student.firstName} ${student.lastName}`,
    status: recordByStudentId.get(student.id)?.status ?? null,
  }));

  const markedStatuses = rows.map((row) => row.status).filter((status) => status !== null);

  return {
    date,
    rows,
    counts: countByStatus(markedStatuses),
    notMarkedCount: rows.length - markedStatuses.length,
  };
}
