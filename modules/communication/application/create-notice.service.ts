import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError, InvalidClassError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaNoticeRepository } from "../infrastructure/prisma-notice.repository";
import { createNoticeSchema, type NoticeDTO } from "./dto/notice.dto";
import type { NoticeEntity } from "../domain/notice.entity";

export interface CreateNoticeContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: NoticeEntity): NoticeDTO {
  return {
    id: entity.id,
    academicSessionId: entity.academicSessionId,
    title: entity.title,
    body: entity.body,
    audience: entity.audience,
    classId: entity.classId,
    sectionId: entity.sectionId,
    attachmentKey: entity.attachmentKey,
    publishedAt: entity.publishedAt ? entity.publishedAt.toISOString() : null,
    expiresAt: entity.expiresAt ? entity.expiresAt.toISOString() : null,
    isActive: entity.isActive,
  };
}

// Notice Board AND Broadcast Messages (Phase 9 Decision 4) — created here in draft (unpublished)
// form; publish-notice.service.ts is the separate "broadcast now" action that dispatches
// notifications.
export async function createNotice(input: unknown, context: CreateNoticeContext): Promise<NoticeDTO> {
  const parsed = createNoticeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid notice data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  if (data.audience !== "ALL" && !data.classId) {
    throw new ValidationError("A class must be selected for a CLASS or SECTION notice.");
  }

  if (data.classId) {
    const classRepository = new PrismaClassRepository();
    const classEntity = await classRepository.findById(tenantId, data.classId);
    if (!classEntity || classEntity.deletedAt !== null) {
      throw new InvalidClassError();
    }
  }

  const repository = new PrismaNoticeRepository();
  const notice = await repository.create({
    tenantId,
    academicSessionId: data.academicSessionId,
    title: data.title,
    body: data.body,
    audience: data.audience,
    classId: data.audience === "ALL" ? null : (data.classId ?? null),
    sectionId: data.audience === "SECTION" ? (data.sectionId ?? null) : null,
    attachmentKey: data.attachmentKey ?? null,
    expiresAt: data.expiresAt ?? null,
    createdBy: actingUserId,
  });

  return toDTO(notice);
}

export { toDTO as toNoticeDTO };
