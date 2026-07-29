import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentAttendanceRepository } from "../infrastructure/prisma-student-attendance.repository";
import { validateAttendanceScope } from "./validate-attendance-scope.helpers";
import {
  bulkMarkStudentAttendanceSchema,
  type StudentAttendanceDTO,
} from "./dto/attendance.dto";

export interface BulkMarkStudentAttendanceContext {
  tenantId: string;
  actingUserId: string;
}

// Bulk Mark Attendance: one class/section/date, many students, marked atomically — either the
// whole roster's attendance is recorded or none of it is (matching admit-student.service.ts's
// single-transaction precedent), rather than leaving a class half-marked if one entry is bad.
// Session/class/section validated ONCE (shared with mark-student-attendance.service.ts via
// validateAttendanceScope), not once per student — no duplicate queries.
export async function bulkMarkStudentAttendance(
  input: unknown,
  context: BulkMarkStudentAttendanceContext
): Promise<StudentAttendanceDTO[]> {
  const parsed = bulkMarkStudentAttendanceSchema.safeParse(input);
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

  const attendanceRepository = new PrismaStudentAttendanceRepository();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const results: StudentAttendanceDTO[] = [];
      for (const entry of data.entries) {
        const attendance = await attendanceRepository.markOne(
          {
            tenantId,
            studentId: entry.studentId,
            academicSessionId: session.id,
            classId: classEntity.id,
            sectionId: section.id,
            date: data.date,
            status: entry.status,
            remarks: entry.remarks ?? null,
            markedBy: actingUserId,
          },
          tx
        );
        results.push({
          id: attendance.id,
          studentId: attendance.studentId,
          academicSessionId: attendance.academicSessionId,
          classId: attendance.classId,
          sectionId: attendance.sectionId,
          date: attendance.date,
          status: attendance.status,
          remarks: attendance.remarks,
          markedBy: attendance.markedBy,
        });
      }
      return results;
    });
  } catch (error) {
    // A student id that doesn't belong to this tenant fails the FK constraint on `create`
    // (P2003) inside the upsert — translated into the same StudentNotFoundError the single-mark
    // path throws for a missing student, rather than leaking a raw Prisma error.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new StudentNotFoundError();
    }
    throw error;
  }
}
