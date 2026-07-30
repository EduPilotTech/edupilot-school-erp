import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { dispatchNotification } from "@/modules/communication/application/dispatch-notification.helpers";
import type { LibraryMemberTypeValue } from "../domain/book-issue.entity";

// Resolves who actually receives a library notification: a STUDENT member's notification goes to
// every guardian with portal access (mirrors notifyGuardiansOfAbsence's own precedent from
// Hostel/Transport attendance); a TEACHER or STAFF member's notification goes to their own
// UserProfile directly, since they carry the account themselves.
export async function notifyLibraryMember(
  tenantId: string,
  memberType: LibraryMemberTypeValue,
  memberId: string,
  notification: { title: string; body: string; referenceType: string; referenceId: string },
  tx?: Prisma.TransactionClient
): Promise<void> {
  if (memberType === "STUDENT") {
    const studentGuardianRepository = new PrismaStudentGuardianRepository();
    const guardianRepository = new PrismaGuardianRepository();
    const links = await studentGuardianRepository.listForStudent(tenantId, memberId);
    for (const link of links) {
      const guardian = await guardianRepository.findById(tenantId, link.guardianId);
      if (!guardian?.userProfileId) continue;
      await dispatchNotification(
        {
          tenantId,
          recipientUserProfileId: guardian.userProfileId,
          type: "LIBRARY_ALERT",
          priority: "NORMAL",
          title: notification.title,
          body: notification.body,
          referenceType: notification.referenceType,
          referenceId: notification.referenceId,
        },
        tx
      );
    }
    return;
  }

  const recipientUserProfileId =
    memberType === "TEACHER"
      ? (await new PrismaTeacherRepository().findById(tenantId, memberId))?.userProfileId
      : memberId;

  if (!recipientUserProfileId) return;

  await dispatchNotification(
    {
      tenantId,
      recipientUserProfileId,
      type: "LIBRARY_ALERT",
      priority: "NORMAL",
      title: notification.title,
      body: notification.body,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
    },
    tx
  );
}
