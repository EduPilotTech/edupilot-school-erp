import "server-only";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import { toStudentTransportAssignmentDTO } from "./assign-student-transport.service";
import type { StudentTransportAssignmentDTO } from "./dto/student-transport-assignment.dto";
import type { StudentTransportAssignmentStatusValue } from "../domain/student-transport-assignment.entity";

export async function listStudentTransportAssignmentsByRoute(
  context: { tenantId: string },
  routeId: string,
  academicSessionId: string,
  filter?: { status?: StudentTransportAssignmentStatusValue }
): Promise<StudentTransportAssignmentDTO[]> {
  const repository = new PrismaStudentTransportAssignmentRepository();
  const assignments = await repository.findByRoute(context.tenantId, routeId, academicSessionId, filter);
  return assignments.map(toStudentTransportAssignmentDTO);
}

export async function getStudentTransportAssignment(
  context: { tenantId: string },
  studentId: string,
  academicSessionId: string
): Promise<StudentTransportAssignmentDTO | null> {
  const repository = new PrismaStudentTransportAssignmentRepository();
  const assignment = await repository.findByStudent(context.tenantId, studentId, academicSessionId);
  return assignment ? toStudentTransportAssignmentDTO(assignment) : null;
}
