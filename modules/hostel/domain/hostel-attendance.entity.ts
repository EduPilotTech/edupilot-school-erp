export type HostelAttendanceSessionValue = "MORNING" | "NIGHT";
export type HostelAttendanceStatusValue = "PRESENT" | "ABSENT" | "ON_LEAVE";

// Mirrors StudentAttendance/TransportAttendance's exact shape — one row per student per day per
// session-leg, roomId denormalized at mark-time so a mid-session room transfer never rewrites
// past attendance.
export interface HostelAttendanceEntity {
  id: string;
  tenantId: string;
  studentId: string;
  studentHostelAssignmentId: string;
  roomId: string;
  date: Date;
  session: HostelAttendanceSessionValue;
  status: HostelAttendanceStatusValue;
  remarks: string | null;
  markedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
