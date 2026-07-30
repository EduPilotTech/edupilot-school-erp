import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import { StudentHostelAssignmentNotFoundError } from "../domain/errors";
import { checkOutStudentHostelSchema, type StudentHostelAssignmentDTO } from "./dto/student-hostel-assignment.dto";
import { toStudentHostelAssignmentDTO } from "./check-in-student-hostel.service";
import type { HostelContext } from "./create-hostel.service";

// Ends a student's hostel stay for the session — closes the current StudentHostelAssignment
// (status=CHECKED_OUT) and frees the bed, atomically.
export async function checkOutStudentHostel(
  input: unknown,
  context: HostelContext
): Promise<StudentHostelAssignmentDTO> {
  const parsed = checkOutStudentHostelSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid check-out data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const current = await assignmentRepository.findCurrentForStudent(tenantId, data.studentId, data.academicSessionId);
  if (!current) {
    throw new StudentHostelAssignmentNotFoundError();
  }

  const bedRepository = new PrismaHostelBedRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const closed = await assignmentRepository.close(tenantId, current.id, data.checkOutDate, "CHECKED_OUT", actingUserId, tx);
    await bedRepository.setStatus(tenantId, current.bedId, "AVAILABLE", tx);

    return toStudentHostelAssignmentDTO(closed);
  });
}
