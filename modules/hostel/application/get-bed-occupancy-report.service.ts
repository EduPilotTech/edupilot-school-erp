import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaHostelRoomRepository } from "../infrastructure/prisma-hostel-room.repository";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import type { BedOccupancyRowDTO, VacantBedRowDTO } from "./dto/reports.dto";

// Bed Occupancy Report (Phase 11 requirement 12).
export async function getBedOccupancyReport(tenantId: string, hostelId: string): Promise<BedOccupancyRowDTO[]> {
  const roomRepository = new PrismaHostelRoomRepository();
  const bedRepository = new PrismaHostelBedRepository();
  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const studentRepository = new PrismaStudentRepository();

  const rooms = await roomRepository.findByHostel(tenantId, hostelId);
  const rows: BedOccupancyRowDTO[] = [];

  for (const room of rooms) {
    const beds = await bedRepository.findByRoom(tenantId, room.id);
    const occupants = await assignmentRepository.findCurrentForRoom(tenantId, room.id);
    const occupantByBedId = new Map(occupants.map((assignment) => [assignment.bedId, assignment]));

    for (const bed of beds) {
      const occupant = occupantByBedId.get(bed.id);
      let occupantName: string | null = null;
      if (occupant) {
        const student = await studentRepository.findById(tenantId, occupant.studentId);
        occupantName = student ? `${student.firstName} ${student.lastName}` : null;
      }

      rows.push({
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        roomId: room.id,
        roomNumber: room.roomNumber,
        status: bed.status,
        occupantStudentId: occupant?.studentId ?? null,
        occupantName,
      });
    }
  }

  rows.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber) || a.bedNumber.localeCompare(b.bedNumber));
  return rows;
}

// Vacant Beds Report (Phase 11 requirement 12) — reads Bed.status directly (AVAILABLE), the
// exact indexed lookup that status field exists to serve (see HostelBedEntity's own comment).
export async function getVacantBedsReport(tenantId: string, hostelId: string): Promise<VacantBedRowDTO[]> {
  const roomRepository = new PrismaHostelRoomRepository();
  const bedRepository = new PrismaHostelBedRepository();

  const rooms = await roomRepository.findByHostel(tenantId, hostelId);
  const rows: VacantBedRowDTO[] = [];

  for (const room of rooms) {
    const vacantBeds = await bedRepository.findVacantByRoom(tenantId, room.id);
    for (const bed of vacantBeds) {
      rows.push({
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        gender: room.gender,
      });
    }
  }

  rows.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber) || a.bedNumber.localeCompare(b.bedNumber));
  return rows;
}
