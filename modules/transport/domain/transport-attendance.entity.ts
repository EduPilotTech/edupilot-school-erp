export type TransportTripLegValue = "PICKUP" | "DROP";
export type TransportAttendanceStatusValue = "BOARDED" | "ABSENT" | "LATE";

// One row per student per day per trip leg. routeId/stopId/vehicleId are denormalized at
// mark-time — a mid-year route change never retroactively rewrites past attendance, mirroring
// StudentAttendance's own denormalization of classId/sectionId.
export interface TransportAttendanceEntity {
  id: string;
  tenantId: string;
  studentId: string;
  studentTransportAssignmentId: string;
  routeId: string;
  stopId: string;
  vehicleId: string;
  date: Date;
  tripLeg: TransportTripLegValue;
  status: TransportAttendanceStatusValue;
  remarks: string | null;
  markedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
