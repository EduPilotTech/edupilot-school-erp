import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, TeacherAttendance as PrismaTeacherAttendance } from "@/lib/generated/prisma/client";
import type {
  MarkTeacherAttendanceInput,
  TeacherAttendanceRepository,
} from "../domain/teacher-attendance.repository";
import type { AttendanceStatusValue, TeacherAttendanceEntity } from "../domain/attendance.entity";

// Prisma maps @db.Time to a JS Date with an arbitrary epoch date part — only the time-of-day
// component is meaningful. Converted to/from a plain "HH:mm" string at this infrastructure
// boundary so the domain layer never has to reason about the bogus date part (@db.Time has no
// timezone, so hours/minutes are extracted via the UTC getters, matching how Postgres returns
// them). Mirrors modules/transport/infrastructure/prisma-route-stop.repository.ts's own
// toTimeString/fromTimeString precedent exactly.
function toTimeString(value: Date | null): string | null {
  if (!value) return null;
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
}

function fromTimeString(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

function toEntity(row: PrismaTeacherAttendance): TeacherAttendanceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userProfileId: row.userProfileId,
    date: row.date,
    status: row.status as AttendanceStatusValue,
    remarks: row.remarks,
    checkInTime: toTimeString(row.checkInTime),
    checkOutTime: toTimeString(row.checkOutTime),
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
            checkInTime: fromTimeString(input.checkInTime) ?? null,
            checkOutTime: fromTimeString(input.checkOutTime) ?? null,
            markedBy: input.markedBy ?? null,
          },
          update: {
            status: input.status,
            remarks: input.remarks ?? null,
            checkInTime: fromTimeString(input.checkInTime),
            checkOutTime: fromTimeString(input.checkOutTime),
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
