import type { Prisma } from "@/lib/generated/prisma/client";
import type { NoticeAudienceValue, NoticeEntity } from "./notice.entity";

export interface CreateNoticeInput {
  tenantId: string;
  academicSessionId: string;
  title: string;
  body: string;
  audience: NoticeAudienceValue;
  classId?: string | null;
  sectionId?: string | null;
  attachmentKey?: string | null;
  expiresAt?: Date | null;
  createdBy?: string | null;
}

export interface NoticeRepository {
  findById(tenantId: string, id: string): Promise<NoticeEntity | null>;

  // Every published, non-expired Notice visible to a specific class+section: ALL-audience
  // Notices, plus CLASS-audience Notices matching classId, plus SECTION-audience Notices
  // matching sectionId. This is what a parent's Notice Board / dashboard reads from.
  findVisibleTo(
    tenantId: string,
    academicSessionId: string,
    classId: string,
    sectionId: string,
    asOfDate: Date
  ): Promise<NoticeEntity[]>;

  // Every Notice for the session regardless of publish/audience state — the staff-facing
  // composer/list view.
  findAll(tenantId: string, academicSessionId: string): Promise<NoticeEntity[]>;

  create(input: CreateNoticeInput, tx?: Prisma.TransactionClient): Promise<NoticeEntity>;

  // The "broadcast now" action (Decision 4) — sets `publishedAt`. `tx` optional so
  // publish-notice.service.ts can set it atomically alongside dispatching Notifications.
  publish(
    tenantId: string,
    id: string,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<NoticeEntity>;

  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<NoticeEntity>;
}
