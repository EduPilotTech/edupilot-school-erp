import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Homework as PrismaHomework } from "@/lib/generated/prisma/client";
import type {
  CreateHomeworkInput,
  HomeworkRepository,
  UpdateHomeworkInput,
} from "../domain/homework.repository";
import type { HomeworkEntity } from "../domain/homework.entity";

function toEntity(row: PrismaHomework): HomeworkEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    classId: row.classId,
    sectionId: row.sectionId,
    subjectId: row.subjectId,
    teacherId: row.teacherId,
    title: row.title,
    description: row.description,
    assignedDate: row.assignedDate,
    dueDate: row.dueDate,
    attachmentKey: row.attachmentKey,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHomeworkRepository implements HomeworkRepository {
  async findById(tenantId: string, id: string): Promise<HomeworkEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.homework.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByClass(tenantId: string, classId: string, sectionId?: string | null): Promise<HomeworkEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.homework.findMany({
        where: {
          tenantId,
          classId,
          deletedAt: null,
          isActive: true,
          ...(sectionId ? { OR: [{ sectionId: null }, { sectionId }] } : {}),
        },
        orderBy: { dueDate: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByTeacher(tenantId: string, teacherId: string): Promise<HomeworkEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.homework.findMany({
        where: { tenantId, teacherId, deletedAt: null },
        orderBy: { dueDate: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHomeworkInput, tx?: Prisma.TransactionClient): Promise<HomeworkEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.homework.create({
          data: {
            tenantId: input.tenantId,
            academicSessionId: input.academicSessionId,
            classId: input.classId,
            sectionId: input.sectionId ?? null,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
            title: input.title,
            description: input.description,
            assignedDate: input.assignedDate,
            dueDate: input.dueDate,
            attachmentKey: input.attachmentKey ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHomeworkInput): Promise<HomeworkEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.homework.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          attachmentKey: input.attachmentKey,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HomeworkEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.homework.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
