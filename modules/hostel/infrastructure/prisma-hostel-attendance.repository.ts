import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelAttendance as PrismaHostelAttendance, Prisma } from "@/lib/generated/prisma/client";
import type {
  HostelAttendanceRepository,
  MarkHostelAttendanceInput,
} from "../domain/hostel-attendance.repository";
import type { HostelAttendanceEntity, HostelAttendanceSessionValue } from "../domain/hostel-attendance.entity";

function toEntity(row: PrismaHostelAttendance): HostelAttendanceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    studentHostelAssignmentId: row.studentHostelAssignmentId,
    roomId: row.roomId,
    date: row.date,
    session: row.session,
    status: row.status,
    remarks: row.remarks,
    markedBy: row.markedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaHostelAttendanceRepository implements HostelAttendanceRepository {
  async markOne(
    input: MarkHostelAttendanceInput,
    tx?: Prisma.TransactionClient
  ): Promise<HostelAttendanceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.hostelAttendance.upsert({
          where: {
            tenantId_studentId_date_session: {
              tenantId: input.tenantId,
              studentId: input.studentId,
              date: input.date,
              session: input.session,
            },
          },
          create: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            studentHostelAssignmentId: input.studentHostelAssignmentId,
            roomId: input.roomId,
            academicSessionId: input.academicSessionId,
            date: input.date,
            session: input.session,
            status: input.status,
            remarks: input.remarks ?? null,
            markedBy: input.markedBy ?? null,
          },
          // Correcting an existing day's record updates status/remarks/marker only — the room a
          // student was actually in on that historical date never changes on re-mark, mirroring
          // TransportAttendanceRepository.markOne's own update-shape.
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

  async findByRoomAndDate(
    tenantId: string,
    roomId: string,
    date: Date,
    session: HostelAttendanceSessionValue
  ): Promise<HostelAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelAttendance.findMany({
        where: { tenantId, roomId, date, session },
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
  ): Promise<HostelAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelAttendance.findMany({
        where: { tenantId, studentId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      })
    );
    return rows.map(toEntity);
  }
}
