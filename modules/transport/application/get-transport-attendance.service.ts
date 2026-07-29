import "server-only";
import { PrismaTransportAttendanceRepository } from "../infrastructure/prisma-transport-attendance.repository";
import type { TransportAttendanceDTO } from "./dto/transport-attendance.dto";
import type { TransportAttendanceEntity, TransportTripLegValue } from "../domain/transport-attendance.entity";

function toDTO(entity: TransportAttendanceEntity): TransportAttendanceDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    studentTransportAssignmentId: entity.studentTransportAssignmentId,
    routeId: entity.routeId,
    stopId: entity.stopId,
    vehicleId: entity.vehicleId,
    date: entity.date,
    tripLeg: entity.tripLeg,
    status: entity.status,
    remarks: entity.remarks,
    markedBy: entity.markedBy,
  };
}

export async function getRouteTransportAttendance(
  context: { tenantId: string },
  routeId: string,
  date: Date,
  tripLeg: TransportTripLegValue
): Promise<TransportAttendanceDTO[]> {
  const repository = new PrismaTransportAttendanceRepository();
  const rows = await repository.findByRouteAndDate(context.tenantId, routeId, date, tripLeg);
  return rows.map(toDTO);
}

export async function getStudentTransportAttendanceHistory(
  context: { tenantId: string },
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<TransportAttendanceDTO[]> {
  const repository = new PrismaTransportAttendanceRepository();
  const rows = await repository.findByStudentAndDateRange(context.tenantId, studentId, startDate, endDate);
  return rows.map(toDTO);
}
