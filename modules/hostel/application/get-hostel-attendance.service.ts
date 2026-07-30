import "server-only";
import { PrismaHostelAttendanceRepository } from "../infrastructure/prisma-hostel-attendance.repository";
import type { HostelAttendanceDTO } from "./dto/hostel-attendance.dto";
import type { HostelAttendanceEntity, HostelAttendanceSessionValue } from "../domain/hostel-attendance.entity";

function toDTO(entity: HostelAttendanceEntity): HostelAttendanceDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    studentHostelAssignmentId: entity.studentHostelAssignmentId,
    roomId: entity.roomId,
    date: entity.date.toISOString().slice(0, 10),
    session: entity.session,
    status: entity.status,
    remarks: entity.remarks,
    markedBy: entity.markedBy,
  };
}

export async function getRoomHostelAttendance(
  context: { tenantId: string },
  roomId: string,
  date: Date,
  session: HostelAttendanceSessionValue
): Promise<HostelAttendanceDTO[]> {
  const repository = new PrismaHostelAttendanceRepository();
  const rows = await repository.findByRoomAndDate(context.tenantId, roomId, date, session);
  return rows.map(toDTO);
}

export async function getStudentHostelAttendanceHistory(
  context: { tenantId: string },
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<HostelAttendanceDTO[]> {
  const repository = new PrismaHostelAttendanceRepository();
  const rows = await repository.findByStudentAndDateRange(context.tenantId, studentId, startDate, endDate);
  return rows.map(toDTO);
}
