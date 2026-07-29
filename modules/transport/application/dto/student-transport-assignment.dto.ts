import { z } from "zod";

export const assignStudentTransportSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  routeId: z.string().uuid("Route is required."),
  stopId: z.string().uuid("Stop is required."),
  tripType: z.enum(["PICKUP_ONLY", "DROP_ONLY", "PICKUP_AND_DROP"]).default("PICKUP_AND_DROP"),
});
export type AssignStudentTransportServiceInput = z.infer<typeof assignStudentTransportSchema>;

export const updateStudentTransportStatusSchema = z.object({
  status: z.enum(["ACTIVE", "TEMPORARY_STOP", "DISCONTINUED"]),
});
export type UpdateStudentTransportStatusServiceInput = z.infer<typeof updateStudentTransportStatusSchema>;

export interface StudentTransportAssignmentDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  routeId: string;
  stopId: string;
  tripType: string;
  status: string;
}
