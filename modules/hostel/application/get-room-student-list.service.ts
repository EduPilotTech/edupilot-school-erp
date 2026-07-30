import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";

export interface RoomStudentRowDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  studentHostelAssignmentId: string;
}

// The hostel analogue of Transport's getRouteStudentList — every currently-assigned student in
// this room, for roster-driven UI (attendance marking).
export async function getRoomStudentList(tenantId: string, roomId: string): Promise<RoomStudentRowDTO[]> {
  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const assignments = await assignmentRepository.findCurrentForRoom(tenantId, roomId);

  const studentRepository = new PrismaStudentRepository();
  const rows: RoomStudentRowDTO[] = [];
  for (const assignment of assignments) {
    const student = await studentRepository.findById(tenantId, assignment.studentId);
    if (!student) continue;
    rows.push({
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      fullName: `${student.firstName} ${student.lastName}`,
      studentHostelAssignmentId: assignment.id,
    });
  }

  rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return rows;
}
