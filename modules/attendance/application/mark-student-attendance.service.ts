import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaStudentAttendanceRepository } from "../infrastructure/prisma-student-attendance.repository";
import { validateAttendanceScope } from "./validate-attendance-scope.helpers";
import { markStudentAttendanceSchema, type StudentAttendanceDTO } from "./dto/attendance.dto";

export interface MarkStudentAttendanceContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: {
  id: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  date: Date;
  status: string;
  remarks: string | null;
  markedBy: string | null;
}): StudentAttendanceDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    classId: entity.classId,
    sectionId: entity.sectionId,
    date: entity.date,
    status: entity.status as StudentAttendanceDTO["status"],
    remarks: entity.remarks,
    markedBy: entity.markedBy,
  };
}

// Phase 5 — Attendance Management. Marks (or corrects) one student's attendance for one day.
// "One record per student per day" is a database guarantee (StudentAttendanceRepository.markOne
// upserts on the `@@unique([tenantId, studentId, date])` constraint), not something this service
// needs to check for separately — re-marking the same day updates it. "Session-aware" and
// "tenant-safe" validation both happen in validateAttendanceScope, shared with bulk-mark.
export async function markStudentAttendance(
  input: unknown,
  context: MarkStudentAttendanceContext
): Promise<StudentAttendanceDTO> {
  const parsed = markStudentAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid attendance data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const { session, classEntity, section } = await validateAttendanceScope(
    tenantId,
    data.academicSessionId,
    data.classId,
    data.sectionId,
    data.date
  );

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const attendanceRepository = new PrismaStudentAttendanceRepository();
  const attendance = await attendanceRepository.markOne({
    tenantId,
    studentId: student.id,
    academicSessionId: session.id,
    classId: classEntity.id,
    sectionId: section.id,
    date: data.date,
    status: data.status,
    remarks: data.remarks ?? null,
    markedBy: actingUserId,
  });

  return toDTO(attendance);
}
