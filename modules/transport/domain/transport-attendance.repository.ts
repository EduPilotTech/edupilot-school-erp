import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  TransportAttendanceEntity,
  TransportAttendanceStatusValue,
  TransportTripLegValue,
} from "./transport-attendance.entity";

export interface MarkTransportAttendanceInput {
  tenantId: string;
  studentId: string;
  studentTransportAssignmentId: string;
  routeId: string;
  stopId: string;
  vehicleId: string;
  date: Date;
  tripLeg: TransportTripLegValue;
  status: TransportAttendanceStatusValue;
  remarks?: string | null;
  markedBy?: string | null;
}

// "One record per student per day per trip leg" is enforced by
// `@@unique([tenantId, studentId, date, tripLeg])` — mirrors StudentAttendanceRepository's own
// upsert-not-create shape exactly (re-marking corrects the existing row).
export interface TransportAttendanceRepository {
  markOne(input: MarkTransportAttendanceInput, tx?: Prisma.TransactionClient): Promise<TransportAttendanceEntity>;

  findByRouteAndDate(
    tenantId: string,
    routeId: string,
    date: Date,
    tripLeg: TransportTripLegValue
  ): Promise<TransportAttendanceEntity[]>;

  findByStudentAndDateRange(
    tenantId: string,
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TransportAttendanceEntity[]>;

  findByVehicleAndDateRange(
    tenantId: string,
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TransportAttendanceEntity[]>;
}
