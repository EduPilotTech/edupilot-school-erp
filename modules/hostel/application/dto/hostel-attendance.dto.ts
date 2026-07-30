import { z } from "zod";

export const hostelAttendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "ON_LEAVE"]);
export const hostelAttendanceSessionSchema = z.enum(["MORNING", "NIGHT"]);

// One room/date/session shared by every entry — matches a room-roster UI (the warden picks the
// room, date, and session leg once, then sets a status per student), mirroring
// bulkMarkTransportAttendanceSchema's own shape exactly.
export const bulkMarkHostelAttendanceSchema = z.object({
  roomId: z.string().uuid("Room is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  date: z.coerce.date(),
  session: hostelAttendanceSessionSchema,
  entries: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid student id."),
        status: hostelAttendanceStatusSchema,
        remarks: z.string().trim().max(500).optional(),
      })
    )
    .min(1, "At least one student is required."),
});
export type BulkMarkHostelAttendanceServiceInput = z.infer<typeof bulkMarkHostelAttendanceSchema>;

export interface HostelAttendanceDTO {
  id: string;
  studentId: string;
  studentHostelAssignmentId: string;
  roomId: string;
  date: string;
  session: string;
  status: string;
  remarks: string | null;
  markedBy: string | null;
}
