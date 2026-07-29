import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, StudentFeeAssignment as PrismaStudentFeeAssignment } from "@/lib/generated/prisma/client";
import type {
  CreateStudentFeeAssignmentInput,
  StudentFeeAssignmentRepository,
  UpdateStudentFeeAssignmentInput,
} from "../domain/student-fee-assignment.repository";
import type { StudentFeeAssignmentEntity } from "../domain/student-fee-assignment.entity";

function toEntity(row: PrismaStudentFeeAssignment): StudentFeeAssignmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    feeStructureId: row.feeStructureId,
    installmentPlanId: row.installmentPlanId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaStudentFeeAssignmentRepository implements StudentFeeAssignmentRepository {
  async findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<StudentFeeAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentFeeAssignment.findUnique({
        where: { tenantId_studentId_academicSessionId: { tenantId, studentId, academicSessionId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByFeeStructure(tenantId: string, feeStructureId: string): Promise<StudentFeeAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.studentFeeAssignment.findMany({ where: { tenantId, feeStructureId, isActive: true } })
    );
    return rows.map(toEntity);
  }

  async upsertForStudent(
    input: CreateStudentFeeAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentFeeAssignmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.studentFeeAssignment.upsert({
          where: {
            tenantId_studentId_academicSessionId: {
              tenantId: input.tenantId,
              studentId: input.studentId,
              academicSessionId: input.academicSessionId,
            },
          },
          create: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
            feeStructureId: input.feeStructureId,
            installmentPlanId: input.installmentPlanId ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
          update: {
            feeStructureId: input.feeStructureId,
            installmentPlanId: input.installmentPlanId ?? null,
            isActive: true,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateStudentFeeAssignmentInput
  ): Promise<StudentFeeAssignmentEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.studentFeeAssignment.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          feeStructureId: input.feeStructureId,
          installmentPlanId: input.installmentPlanId,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }
}
