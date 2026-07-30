import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaStudentHostelAssignmentRepository } from "../infrastructure/prisma-student-hostel-assignment.repository";
import { PrismaHostelLeaveRequestRepository } from "../infrastructure/prisma-hostel-leave-request.repository";
import { InvalidHostelAssignmentError, StudentHostelAssignmentNotFoundError } from "../domain/errors";
import { requestHostelLeaveSchema, type HostelLeaveRequestDTO } from "./dto/hostel-leave-request.dto";
import type { HostelLeaveRequestEntity } from "../domain/hostel-leave-request.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelLeaveRequestEntity): HostelLeaveRequestDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    leaveType: entity.leaveType,
    fromDate: entity.fromDate.toISOString().slice(0, 10),
    toDate: entity.toDate.toISOString().slice(0, 10),
    reason: entity.reason,
    status: entity.status,
    approvedBy: entity.approvedBy,
    approvedAt: entity.approvedAt ? entity.approvedAt.toISOString() : null,
    rejectionReason: entity.rejectionReason,
    actualReturnDate: entity.actualReturnDate ? entity.actualReturnDate.toISOString().slice(0, 10) : null,
  };
}

export async function requestHostelLeave(input: unknown, context: HostelContext): Promise<HostelLeaveRequestDTO> {
  const parsed = requestHostelLeaveSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid leave request data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  if (data.toDate < data.fromDate) {
    throw new InvalidHostelAssignmentError("The return date cannot be before the leave start date.");
  }

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const assignmentRepository = new PrismaStudentHostelAssignmentRepository();
  const assignment = await assignmentRepository.findCurrentForStudent(tenantId, data.studentId, data.academicSessionId);
  if (!assignment) {
    throw new StudentHostelAssignmentNotFoundError();
  }

  const repository = new PrismaHostelLeaveRequestRepository();
  const leave = await repository.create({
    tenantId,
    studentId: data.studentId,
    studentHostelAssignmentId: assignment.id,
    leaveType: data.leaveType,
    fromDate: data.fromDate,
    toDate: data.toDate,
    reason: data.reason,
    createdBy: actingUserId,
  });
  return toDTO(leave);
}

export { toDTO as toHostelLeaveRequestDTO };
