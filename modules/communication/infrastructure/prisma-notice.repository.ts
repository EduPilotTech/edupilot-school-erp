import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Notice as PrismaNotice } from "@/lib/generated/prisma/client";
import type { CreateNoticeInput, NoticeRepository } from "../domain/notice.repository";
import type { NoticeAudienceValue, NoticeEntity } from "../domain/notice.entity";

function toEntity(row: PrismaNotice): NoticeEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    title: row.title,
    body: row.body,
    audience: row.audience as NoticeAudienceValue,
    classId: row.classId,
    sectionId: row.sectionId,
    attachmentKey: row.attachmentKey,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaNoticeRepository implements NoticeRepository {
  async findById(tenantId: string, id: string): Promise<NoticeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.notice.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findVisibleTo(
    tenantId: string,
    academicSessionId: string,
    classId: string,
    sectionId: string,
    asOfDate: Date
  ): Promise<NoticeEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.notice.findMany({
        where: {
          tenantId,
          academicSessionId,
          deletedAt: null,
          isActive: true,
          publishedAt: { not: null, lte: asOfDate },
          OR: [{ expiresAt: null }, { expiresAt: { gte: asOfDate } }],
          AND: [
            {
              OR: [{ audience: "ALL" }, { audience: "CLASS", classId }, { audience: "SECTION", sectionId }],
            },
          ],
        },
        orderBy: { publishedAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findAll(tenantId: string, academicSessionId: string): Promise<NoticeEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.notice.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateNoticeInput, tx?: Prisma.TransactionClient): Promise<NoticeEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.notice.create({
          data: {
            tenantId: input.tenantId,
            academicSessionId: input.academicSessionId,
            title: input.title,
            body: input.body,
            audience: input.audience,
            classId: input.classId ?? null,
            sectionId: input.sectionId ?? null,
            attachmentKey: input.attachmentKey ?? null,
            expiresAt: input.expiresAt ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async publish(
    tenantId: string,
    id: string,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<NoticeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.notice.update({
          where: { tenantId_id: { tenantId, id } },
          data: { publishedAt: new Date(), updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<NoticeEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.notice.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
