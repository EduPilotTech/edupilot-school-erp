import "server-only";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import { toStudentHostelAssignmentDTO } from "./check-in-student-hostel.service";
import type { StudentHostelAssignmentDTO } from "./dto/student-hostel-assignment.dto";

export async function getCurrentStudentHostelAssignment(
  tenantId: string,
  studentId: string,
  academicSessionId: string
): Promise<StudentHostelAssignmentDTO | null> {
  const repository = new PrismaStudentHostelAssignmentRepository();
  const assignment = await repository.findCurrentForStudent(tenantId, studentId, academicSessionId);
  return assignment ? toStudentHostelAssignmentDTO(assignment) : null;
}

// History (requirement: "Transfer / History") — every past and current assignment for this
// student, most recent first.
export async function getStudentHostelHistory(
  tenantId: string,
  studentId: string
): Promise<StudentHostelAssignmentDTO[]> {
  const repository = new PrismaStudentHostelAssignmentRepository();
  const history = await repository.findHistoryForStudent(tenantId, studentId);
  return history.map(toStudentHostelAssignmentDTO);
}

export async function listCurrentAssignmentsForRoom(
  tenantId: string,
  roomId: string
): Promise<StudentHostelAssignmentDTO[]> {
  const repository = new PrismaStudentHostelAssignmentRepository();
  const assignments = await repository.findCurrentForRoom(tenantId, roomId);
  return assignments.map(toStudentHostelAssignmentDTO);
}
