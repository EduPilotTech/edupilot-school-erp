import "server-only";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import type { RoomOccupancyReportDTO, RoomOccupancyRowDTO } from "./dto/reports.dto";

// Room Occupancy Report (Phase 11 requirement 12).
export async function getRoomOccupancyReport(tenantId: string, hostelId: string): Promise<RoomOccupancyReportDTO> {
  const roomRepository = new PrismaHostelRoomRepository();
  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();

  const rooms = await roomRepository.findByHostel(tenantId, hostelId);
  const rows: RoomOccupancyRowDTO[] = [];

  for (const room of rooms) {
    const occupants = await assignmentRepository.findCurrentForRoom(tenantId, room.id);
    const occupiedCount = occupants.length;
    const vacantCount = Math.max(room.capacity - occupiedCount, 0);
    const occupancyPercent = room.capacity > 0 ? Math.round((occupiedCount / room.capacity) * 1000) / 10 : 0;

    rows.push({
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      occupiedCount,
      vacantCount,
      occupancyPercent,
    });
  }

  rows.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

  return { hostelId, rows };
}
