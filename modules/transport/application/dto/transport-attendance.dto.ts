import { z } from "zod";

export const transportAttendanceStatusSchema = z.enum(["BOARDED", "ABSENT", "LATE"]);
export const transportTripLegSchema = z.enum(["PICKUP", "DROP"]);

// One route/date/tripLeg shared by every entry — matches a route-roster UI (transport
// coordinator picks the route, date, and leg once, then sets a status per student), mirroring
// bulkMarkStudentAttendanceSchema's own shape exactly.
export const bulkMarkTransportAttendanceSchema = z.object({
  routeId: z.string().uuid("Route is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  date: z.coerce.date(),
  tripLeg: transportTripLegSchema,
  entries: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid student id."),
        status: transportAttendanceStatusSchema,
        remarks: z.string().trim().max(500).optional(),
      })
    )
    .min(1, "At least one student is required."),
});
export type BulkMarkTransportAttendanceServiceInput = z.infer<typeof bulkMarkTransportAttendanceSchema>;

export interface TransportAttendanceDTO {
  id: string;
  studentId: string;
  studentTransportAssignmentId: string;
  routeId: string;
  stopId: string;
  vehicleId: string;
  date: Date;
  tripLeg: string;
  status: string;
  remarks: string | null;
  markedBy: string | null;
}
