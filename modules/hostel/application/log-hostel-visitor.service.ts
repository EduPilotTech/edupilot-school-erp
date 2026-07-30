import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaHostelVisitorRepository } from "../infrastructure/prisma-hostel-visitor.repository";
import { logHostelVisitorSchema, type HostelVisitorDTO } from "./dto/hostel-visitor.dto";
import type { HostelVisitorEntity } from "../domain/hostel-visitor.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelVisitorEntity): HostelVisitorDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    visitorName: entity.visitorName,
    relation: entity.relation,
    purpose: entity.purpose,
    entryTime: entity.entryTime.toISOString(),
    exitTime: entity.exitTime ? entity.exitTime.toISOString() : null,
    approvedBy: entity.approvedBy,
  };
}

export async function logHostelVisitor(input: unknown, context: HostelContext): Promise<HostelVisitorDTO> {
  const parsed = logHostelVisitorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid visitor data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const repository = new PrismaHostelVisitorRepository();
  const visitor = await repository.create({
    tenantId,
    studentId: data.studentId,
    visitorName: data.visitorName,
    relation: data.relation,
    purpose: data.purpose,
    entryTime: data.entryTime,
    approvedBy: data.approvedBy ?? actingUserId,
    createdBy: actingUserId,
  });
  return toDTO(visitor);
}

export { toDTO as toHostelVisitorDTO };
