import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, TransportAttendance as PrismaTransportAttendance } from "@/lib/generated/prisma/client";
import type {
  MarkTransportAttendanceInput,
  TransportAttendanceRepository,
} from "../domain/transport-attendance.repository";
import type { TransportAttendanceEntity, TransportTripLegValue } from "../domain/transport-attendance.entity";

function toEntity(row: PrismaTransportAttendance): TransportAttendanceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    studentTransportAssignmentId: row.studentTransportAssignmentId,
    routeId: row.routeId,
    stopId: row.stopId,
    vehicleId: row.vehicleId,
    date: row.date,
    tripLeg: row.tripLeg,
    status: row.status,
    remarks: row.remarks,
    markedBy: row.markedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTransportAttendanceRepository implements TransportAttendanceRepository {
  async markOne(
    input: MarkTransportAttendanceInput,
    tx?: Prisma.TransactionClient
  ): Promise<TransportAttendanceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.transportAttendance.upsert({
          where: {
            tenantId_studentId_date_tripLeg: {
              tenantId: input.tenantId,
              studentId: input.studentId,
              date: input.date,
              tripLeg: input.tripLeg,
            },
          },
          create: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            studentTransportAssignmentId: input.studentTransportAssignmentId,
            routeId: input.routeId,
            stopId: input.stopId,
            vehicleId: input.vehicleId,
            date: input.date,
            tripLeg: input.tripLeg,
            status: input.status,
            remarks: input.remarks ?? null,
            markedBy: input.markedBy ?? null,
          },
          // Correcting an existing day's record updates status/remarks/marker only — the
          // route/stop/vehicle a student actually rode on that historical date never changes on
          // re-mark, mirroring StudentAttendanceRepository.markOne's own update-shape.
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

  async findByRouteAndDate(
    tenantId: string,
    routeId: string,
    date: Date,
    tripLeg: TransportTripLegValue
  ): Promise<TransportAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.transportAttendance.findMany({
        where: { tenantId, routeId, date, tripLeg },
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
  ): Promise<TransportAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.transportAttendance.findMany({
        where: { tenantId, studentId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByVehicleAndDateRange(
    tenantId: string,
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TransportAttendanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.transportAttendance.findMany({
        where: { tenantId, vehicleId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      })
    );
    return rows.map(toEntity);
  }
}
