import "server-only";
import { prisma } from "@/lib/prisma";
import { listStudents } from "@/modules/students/application/list-students.service";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { PrismaNoticeRepository } from "../infrastructure/prisma-notice.repository";
import { dispatchNotification } from "./dispatch-notification.helpers";
import { NoticeNotFoundError } from "../domain/errors";
import { toNoticeDTO } from "./create-notice.service";
import type { NoticeDTO } from "./dto/notice.dto";

export interface PublishNoticeContext {
  tenantId: string;
  actingUserId: string;
}

const RESULTS_PAGE_SIZE = 1000;

// The "broadcast now" action (Phase 9 Decision 4) — publishes the Notice, then resolves every
// guardian with linked portal access whose child falls within the Notice's audience (ALL/CLASS/
// SECTION) and dispatches one Notification to each, atomically with the publish itself.
export async function publishNotice(noticeId: string, context: PublishNoticeContext): Promise<NoticeDTO> {
  const { tenantId, actingUserId } = context;

  const noticeRepository = new PrismaNoticeRepository();
  const notice = await noticeRepository.findById(tenantId, noticeId);
  if (!notice || notice.deletedAt !== null) {
    throw new NoticeNotFoundError();
  }

  const studentResult = await listStudents(
    {
      academicSessionId: notice.academicSessionId,
      classId: notice.audience !== "ALL" ? (notice.classId ?? undefined) : undefined,
      sectionId: notice.audience === "SECTION" ? (notice.sectionId ?? undefined) : undefined,
      page: 1,
      pageSize: RESULTS_PAGE_SIZE,
    },
    { tenantId }
  );

  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const guardianIds = new Set<string>();
  for (const student of studentResult.items) {
    const links = await studentGuardianRepository.listForStudent(tenantId, student.id);
    for (const link of links) {
      guardianIds.add(link.guardianId);
    }
  }

  const guardianRepository = new PrismaGuardianRepository();
  const recipientUserProfileIds: string[] = [];
  for (const guardianId of guardianIds) {
    const guardian = await guardianRepository.findById(tenantId, guardianId);
    if (guardian?.userProfileId) {
      recipientUserProfileIds.push(guardian.userProfileId);
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const published = await noticeRepository.publish(tenantId, noticeId, actingUserId, tx);

    for (const recipientUserProfileId of recipientUserProfileIds) {
      await dispatchNotification(
        {
          tenantId,
          recipientUserProfileId,
          type: "NOTICE",
          priority: "NORMAL",
          title: notice.title,
          body: notice.body,
          referenceType: "Notice",
          referenceId: notice.id,
        },
        tx
      );
    }

    return toNoticeDTO(published);
  });
}
