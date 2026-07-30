import "server-only";
import { PrismaHostelAttendanceRepository } from "../infrastructure/prisma-hostel-attendance.repository";
import type { HostelAttendanceSummaryDTO } from "./dto/reports.dto";
import type { HostelAttendanceSessionValue } from "../domain/hostel-attendance.entity";

// Hostel Attendance Report (Phase 11 requirement 12) — present/absent/on-leave counts for one
// room/date/session.
export async function getHostelAttendanceReport(
  tenantId: string,
  roomId: string,
  date: Date,
  session: HostelAttendanceSessionValue
): Promise<HostelAttendanceSummaryDTO> {
  const repository = new PrismaHostelAttendanceRepository();
  const rows = await repository.findByRoomAndDate(tenantId, roomId, date, session);

  return {
    roomId,
    date: date.toISOString().slice(0, 10),
    session,
    presentCount: rows.filter((row) => row.status === "PRESENT").length,
    absentCount: rows.filter((row) => row.status === "ABSENT").length,
    onLeaveCount: rows.filter((row) => row.status === "ON_LEAVE").length,
  };
}
