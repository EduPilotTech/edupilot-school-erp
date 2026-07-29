import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, HomeworkStatus as PrismaHomeworkStatus } from "@/lib/generated/prisma/client";
import type {
  HomeworkStatusRepository,
  SetHomeworkStatusInput,
} from "../domain/homework-status.repository";
import type { HomeworkStatusEntity, HomeworkStatusValue } from "../domain/homework-status.entity";

function toEntity(row: PrismaHomeworkStatus): HomeworkStatusEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    homeworkId: row.homeworkId,
    studentId: row.studentId,
    status: row.status as HomeworkStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHomeworkStatusRepository implements HomeworkStatusRepository {
  async findByHomework(tenantId: string, homeworkId: string): Promise<HomeworkStatusEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.homeworkStatus.findMany({ where: { tenantId, homeworkId } })
    );
    return rows.map(toEntity);
  }

  async findByStudent(tenantId: string, studentId: string): Promise<HomeworkStatusEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.homeworkStatus.findMany({ where: { tenantId, studentId } })
    );
    return rows.map(toEntity);
  }

  async findByHomeworkAndStudent(
    tenantId: string,
    homeworkId: string,
    studentId: string
  ): Promise<HomeworkStatusEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.homeworkStatus.findUnique({
        where: { tenantId_homeworkId_studentId: { tenantId, homeworkId, studentId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async upsert(input: SetHomeworkStatusInput, tx?: Prisma.TransactionClient): Promise<HomeworkStatusEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.homeworkStatus.upsert({
          where: {
            tenantId_homeworkId_studentId: {
              tenantId: input.tenantId,
              homeworkId: input.homeworkId,
              studentId: input.studentId,
            },
          },
          create: {
            tenantId: input.tenantId,
            homeworkId: input.homeworkId,
            studentId: input.studentId,
            status: input.status,
            updatedBy: input.updatedBy ?? null,
          },
          update: {
            status: input.status,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
