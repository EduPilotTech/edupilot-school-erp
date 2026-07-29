import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, StudentAttendance as PrismaStudentAttendance } from "@/lib/generated/prisma/client";
import type {
  MarkStudentAttendanceInput,
  StudentAttendanceRepository,
} from "../domain/student-attendance.repository";
import type { AttendanceStatusValue, StudentAttendanceEntity } from "../domain/attendance.entity";

function toEntity(row: PrismaStudentAttendance): StudentAttendanceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    classId: row.classId,
    sectionId: row.sectionId,
    date: row.date,
    status: row.status as AttendanceStatusValue,
    remarks: row.remarks,
    markedBy: row.markedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaStudentAttendanceRepository implements StudentAttendanceRepository {
  async markOne(
    input: MarkStudentAttendanceInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentAttendanceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.studentAttendance.upsert({
          where: {
            tenantId_studentId_date: {
              tenantId: input.tenantId,
              studentId: input.studentId,
              date: input.date,
            },
          },
          create: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
            classId: input.classId,
            sectionId: input.sectionId,
            date: input.date,
            status: input.status,
            remarks: input.remarks ?? null,
            markedBy: input.markedBy ?? null,
          },
          // Correcting an existing day's record updates status/remarks/marker only — the
          // session/class/section a student was in on that historical date never changes on
          // re-mark, only the very first `create` sets those.
          update: {
            status: input.status,
            remarks: input.remarks ?? null,
            markedBy: input.markedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async findByClassAndDate(
    tenantId: string,
    classId: string,
    sectionId: string,
    date: Date
  ): Promise<StudentAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentAttendance.findMany({
        where: { tenantId, classId, sectionId, date },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByStudentAndDateRange(
    tenantId: string,
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudentAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentAttendance.findMany({
        where: { tenantId, studentId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByClassAndDateRange(
    tenantId: string,
    classId: string,
    sectionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudentAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentAttendance.findMany({
        where: { tenantId, classId, sectionId, date: { gte: startDate, lte: endDate } },
        orderBy: [{ date: "asc" }, { studentId: "asc" }],
      })
    );
    return rows.map(toEntity);
  }
}
