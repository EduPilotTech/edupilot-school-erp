import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, TeacherAssignment as PrismaTeacherAssignment } from "@/lib/generated/prisma/client";
import type {
  TeacherAssignmentRepository,
  UpsertTeacherAssignmentInput,
} from "../domain/teacher-assignment.repository";
import type { TeacherAssignmentEntity } from "../domain/teacher-assignment.entity";

function toEntity(row: PrismaTeacherAssignment): TeacherAssignmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    teacherId: row.teacherId,
    subjectId: row.subjectId,
    academicSessionId: row.academicSessionId,
    classId: row.classId,
    sectionId: row.sectionId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaTeacherAssignmentRepository implements TeacherAssignmentRepository {
  async findById(tenantId: string, id: string): Promise<TeacherAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacherAssignment.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByTeacher(
    tenantId: string,
    teacherId: string,
    academicSessionId: string
  ): Promise<TeacherAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.teacherAssignment.findMany({
        where: { tenantId, teacherId, academicSessionId, isActive: true },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByClass(
    tenantId: string,
    classId: string,
    sectionId: string,
    academicSessionId: string
  ): Promise<TeacherAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.teacherAssignment.findMany({
        where: { tenantId, classId, sectionId, academicSessionId, isActive: true },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async upsertOne(
    input: UpsertTeacherAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<TeacherAssignmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.teacherAssignment.upsert({
          where: {
            tenantId_teacherId_subjectId_classId_sectionId_academicSessionId: {
              tenantId: input.tenantId,
              teacherId: input.teacherId,
              subjectId: input.subjectId,
              classId: input.classId,
              sectionId: input.sectionId,
              academicSessionId: input.academicSessionId,
            },
          },
          create: {
            tenantId: input.tenantId,
            teacherId: input.teacherId,
            subjectId: input.subjectId,
            classId: input.classId,
            sectionId: input.sectionId,
            academicSessionId: input.academicSessionId,
            isActive: input.isActive,
            createdBy: input.updatedBy ?? null,
          },
          update: { isActive: input.isActive, updatedBy: input.updatedBy ?? null },
        }),
      tx
    );
    return toEntity(row);
  }
}
