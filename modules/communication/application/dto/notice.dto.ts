import { z } from "zod";
import type { NoticeAudienceValue } from "../../domain/notice.entity";

export const createNoticeSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  title: z.string().trim().min(1, "Title is required.").max(200),
  body: z.string().trim().min(1, "Body is required.").max(10000),
  audience: z.enum(["ALL", "CLASS", "SECTION"]),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  attachmentKey: z.string().trim().max(500).optional(),
  expiresAt: z.coerce.date().optional(),
});
export type CreateNoticeServiceInput = z.infer<typeof createNoticeSchema>;

export interface NoticeDTO {
  id: string;
  academicSessionId: string;
  title: string;
  body: string;
  audience: NoticeAudienceValue;
  classId: string | null;
  sectionId: string | null;
  attachmentKey: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}
