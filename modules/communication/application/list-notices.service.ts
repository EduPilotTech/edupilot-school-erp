import "server-only";
import { PrismaNoticeRepository } from "../infrastructure/prisma-notice.repository";
import { toNoticeDTO } from "./create-notice.service";
import type { NoticeDTO } from "./dto/notice.dto";

export async function listNotices(tenantId: string, academicSessionId: string): Promise<NoticeDTO[]> {
  const repository = new PrismaNoticeRepository();
  const items = await repository.findAll(tenantId, academicSessionId);
  return items.map(toNoticeDTO);
}

// Notice Board (requirement 14) — every published, non-expired Notice visible to a specific
// class+section, composed for a parent/student-facing read.
export async function listVisibleNotices(
  tenantId: string,
  academicSessionId: string,
  classId: string,
  sectionId: string
): Promise<NoticeDTO[]> {
  const repository = new PrismaNoticeRepository();
  const items = await repository.findVisibleTo(tenantId, academicSessionId, classId, sectionId, new Date());
  return items.map(toNoticeDTO);
}
