import "server-only";
import { ValidationError } from "@/lib/errors";
import { listStudents } from "@/modules/students/application/list-students.service";
import { PrismaStudentAttendanceRepository } from "../infrastructure/prisma-student-attendance.repository";
import { countByStatus } from "./attendance-counts.helpers";
import {
  getClassAttendanceSummarySchema,
  type ClassAttendanceSummaryDTO,
  type ClassAttendanceSummaryRow,
} from "./dto/attendance-report.dto";
import type { AttendanceStatusValue } from "../domain/attendance.entity";

export interface GetClassAttendanceSummaryContext {
  tenantId: string;
}

// Powers BOTH the Monthly Report and the Class-wise Report — the two only differ in what date
// range the caller passes in (Monthly: the first/last day of a calendar month; Class-wise:
// whatever arbitrary range the user picks). One per-student aggregate-counts service, not two
// near-duplicate ones.
export async function getClassAttendanceSummary(
  input: unknown,
  context: GetClassAttendanceSummaryContext
): Promise<ClassAttendanceSummaryDTO> {
  const parsed = getClassAttendanceSummarySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid report request.");
  }
  const { classId, sectionId, startDate, endDate } = parsed.data;
  const { tenantId } = context;

  const [roster, records] = await Promise.all([
    listStudents({ classId, sectionId, page: 1, pageSize: 200 }, { tenantId }),
    new PrismaStudentAttendanceRepository().findByClassAndDateRange(
      tenantId,
      classId,
      sectionId,
      startDate,
      endDate
    ),
  ]);

  const statusesByStudentId = new Map<string, AttendanceStatusValue[]>();
  for (const record of records) {
    const list = statusesByStudentId.get(record.studentId) ?? [];
    list.push(record.status);
    statusesByStudentId.set(record.studentId, list);
  }

  const rows: ClassAttendanceSummaryRow[] = roster.items.map((student) => ({
    studentId: student.id,
    admissionNumber: student.admissionNumber,
    fullName: `${student.firstName} ${student.lastName}`,
    counts: countByStatus(statusesByStudentId.get(student.id) ?? []),
  }));

  return { startDate, endDate, rows };
}
