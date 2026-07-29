import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, MessageThread as PrismaMessageThread } from "@/lib/generated/prisma/client";
import type {
  CreateMessageThreadInput,
  MessageThreadRepository,
} from "../domain/message-thread.repository";
import type { MessageThreadEntity } from "../domain/message-thread.entity";

function toEntity(row: PrismaMessageThread): MessageThreadEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    guardianId: row.guardianId,
    teacherId: row.teacherId,
    subject: row.subject,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaMessageThreadRepository implements MessageThreadRepository {
  async findById(tenantId: string, id: string): Promise<MessageThreadEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messageThread.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByTriple(
    tenantId: string,
    studentId: string,
    guardianId: string,
    teacherId: string
  ): Promise<MessageThreadEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messageThread.findUnique({
        where: { tenantId_studentId_guardianId_teacherId: { tenantId, studentId, guardianId, teacherId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByGuardian(tenantId: string, guardianId: string): Promise<MessageThreadEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.messageThread.findMany({
        where: { tenantId, guardianId, isActive: true },
        orderBy: { updatedAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByTeacher(tenantId: string, teacherId: string): Promise<MessageThreadEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.messageThread.findMany({
        where: { tenantId, teacherId, isActive: true },
        orderBy: { updatedAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateMessageThreadInput, tx?: Prisma.TransactionClient): Promise<MessageThreadEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.messageThread.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            guardianId: input.guardianId,
            teacherId: input.teacherId,
            subject: input.subject ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
