import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import { StudentTransportAssignmentNotFoundError } from "../domain/errors";
import { updateStudentTransportStatusSchema, type StudentTransportAssignmentDTO } from "./dto/student-transport-assignment.dto";
import { toStudentTransportAssignmentDTO } from "./assign-student-transport.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateStudentTransportStatus(
  studentId: string,
  academicSessionId: string,
  input: unknown,
  context: TransportContext
): Promise<StudentTransportAssignmentDTO> {
  const parsed = updateStudentTransportStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid status.");
  }
  const { tenantId, actingUserId } = context;

  const repository = new PrismaStudentTransportAssignmentRepository();
  const existing = await repository.findByStudent(tenantId, studentId, academicSessionId);
  if (!existing) {
    throw new StudentTransportAssignmentNotFoundError();
  }

  const assignment = await repository.updateStatus(tenantId, existing.id, {
    status: parsed.data.status,
    updatedBy: actingUserId,
  });
  return toStudentTransportAssignmentDTO(assignment);
}
