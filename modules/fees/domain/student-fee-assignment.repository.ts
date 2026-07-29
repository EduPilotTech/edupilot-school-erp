import type { Prisma } from "@/lib/generated/prisma/client";
import type { StudentFeeAssignmentEntity } from "./student-fee-assignment.entity";

export interface CreateStudentFeeAssignmentInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  feeStructureId: string;
  installmentPlanId?: string | null;
  createdBy?: string | null;
}

export interface UpdateStudentFeeAssignmentInput {
  feeStructureId?: string;
  installmentPlanId?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

// One row per student per session (`@@unique([tenantId, studentId, academicSessionId])`) —
// `upsertForStudent` is the primary write path, mirroring StudentAttendance.markOne's
// "correction is an upsert on the natural key" shape, since re-assigning a student to a
// different structure mid-year is expected (not append-only like Enrollment).
export interface StudentFeeAssignmentRepository {
  findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<StudentFeeAssignmentEntity | null>;
  findByFeeStructure(tenantId: string, feeStructureId: string): Promise<StudentFeeAssignmentEntity[]>;
  upsertForStudent(
    input: CreateStudentFeeAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentFeeAssignmentEntity>;
  update(
    tenantId: string,
    id: string,
    input: UpdateStudentFeeAssignmentInput
  ): Promise<StudentFeeAssignmentEntity>;
}
