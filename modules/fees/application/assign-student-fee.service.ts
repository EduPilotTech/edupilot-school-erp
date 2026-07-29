import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError, StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaFeeStructureRepository } from "../infrastructure/prisma-fee-structure.repository";
import { PrismaInstallmentPlanRepository } from "../infrastructure/prisma-installment-plan.repository";
import { PrismaStudentFeeAssignmentRepository } from "../infrastructure/prisma-student-fee-assignment.repository";
import { FeeStructureNotFoundError, InstallmentPlanNotFoundError } from "../domain/errors";
import { assignStudentFeeSchema, type StudentFeeAssignmentDTO } from "./dto/student-fee-assignment.dto";
import type { StudentFeeAssignmentEntity } from "../domain/student-fee-assignment.entity";

export interface AssignStudentFeeContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: StudentFeeAssignmentEntity): StudentFeeAssignmentDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    feeStructureId: entity.feeStructureId,
    installmentPlanId: entity.installmentPlanId,
    isActive: entity.isActive,
  };
}

// Upsert on the natural key (studentId, academicSessionId) — reassigning a student to a
// different structure mid-year updates the existing row rather than creating a new one (unlike
// Enrollment, fee-assignment history isn't a stated requirement this phase).
export async function assignStudentFee(
  input: unknown,
  context: AssignStudentFeeContext
): Promise<StudentFeeAssignmentDTO> {
  const parsed = assignStudentFeeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fee assignment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const structureRepository = new PrismaFeeStructureRepository();
  const structure = await structureRepository.findById(tenantId, data.feeStructureId);
  if (!structure || structure.deletedAt !== null) {
    throw new FeeStructureNotFoundError();
  }

  if (data.installmentPlanId) {
    const planRepository = new PrismaInstallmentPlanRepository();
    const plan = await planRepository.findById(tenantId, data.installmentPlanId);
    if (!plan || plan.deletedAt !== null) {
      throw new InstallmentPlanNotFoundError();
    }
  }

  const repository = new PrismaStudentFeeAssignmentRepository();
  const assignment = await repository.upsertForStudent({
    tenantId,
    studentId: data.studentId,
    academicSessionId: data.academicSessionId,
    feeStructureId: data.feeStructureId,
    installmentPlanId: data.installmentPlanId ?? null,
    createdBy: actingUserId,
  });
  return toDTO(assignment);
}

export async function getStudentFeeAssignment(
  tenantId: string,
  studentId: string,
  academicSessionId: string
): Promise<StudentFeeAssignmentDTO | null> {
  const repository = new PrismaStudentFeeAssignmentRepository();
  const assignment = await repository.findByStudent(tenantId, studentId, academicSessionId);
  return assignment ? toDTO(assignment) : null;
}
