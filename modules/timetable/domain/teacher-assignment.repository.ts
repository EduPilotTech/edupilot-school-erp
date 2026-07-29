import type { Prisma } from "@/lib/generated/prisma/client";
import type { TeacherAssignmentEntity } from "./teacher-assignment.entity";

export interface UpsertTeacherAssignmentInput {
  tenantId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
  isActive: boolean;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request. `upsertOne` (assign/unassign both go through
// this) rather than separate create/delete — see the entity's own comment for why.
export interface TeacherAssignmentRepository {
  findById(tenantId: string, id: string): Promise<TeacherAssignmentEntity | null>;
  findByTeacher(tenantId: string, teacherId: string, academicSessionId: string): Promise<TeacherAssignmentEntity[]>;
  findByClass(
    tenantId: string,
    classId: string,
    sectionId: string,
    academicSessionId: string
  ): Promise<TeacherAssignmentEntity[]>;
  upsertOne(
    input: UpsertTeacherAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<TeacherAssignmentEntity>;
}
