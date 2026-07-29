export type NoticeAudienceValue = "ALL" | "CLASS" | "SECTION";

// Notice Board AND Broadcast Messages (Phase 9 Decision 4) — a broadcast is a Notice whose
// publish action dispatches a Notification immediately; there is no separate broadcast entity.
export interface NoticeEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  title: string;
  body: string;
  audience: NoticeAudienceValue;
  classId: string | null;
  sectionId: string | null;
  attachmentKey: string | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
