import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, TeacherAttendance as PrismaTeacherAttendance } from "@/lib/generated/prisma/client";
import type {
  MarkTeacherAttendanceInput,
  TeacherAttendanceRepository,
} from "../domain/teacher-attendance.repository";
import type { AttendanceStatusValue, TeacherAttendanceEntity } from "../domain/attendance.entity";

function toEntity(row: PrismaTeacherAttendance): TeacherAttendanceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userProfileId: row.userProfileId,
    date: row.date,
    status: row.status as AttendanceStatusValue,
    remarks: row.remarks,
    markedBy: row.markedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTeacherAttendanceRepository implements TeacherAttendanceRepository {
  async markOne(
    input: MarkTeacherAttendanceInput,
    tx?: Prisma.TransactionClient
  ): Promise<TeacherAttendanceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.teacherAttendance.upsert({
          where: {
            tenantId_userProfileId_date: {
              tenantId: input.tenantId,
              userProfileId: input.userProfileId,
              date: input.date,
            },
          },
          create: {
            tenantId: input.tenantId,
            userProfileId: input.userProfileId,
            date: input.date,
            status: input.status,
            remarks: input.remarks ?? null,
            markedBy: input.markedBy ?? null,
          },
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

  async findByDate(tenantId: string, date: Date): Promise<TeacherAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.teacherAttendance.findMany({
        where: { tenantId, date },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByUserAndDateRange(
    tenantId: string,
    userProfileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeacherAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.teacherAttendance.findMany({
        where: { tenantId, userProfileId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      })
    );
    return rows.map(toEntity);
  }
}
