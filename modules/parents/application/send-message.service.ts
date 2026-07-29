import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { TeacherNotFoundError } from "@/modules/teachers/domain/errors";
import { postMessage } from "@/modules/communication/application/post-message.helpers";
import { sendMessageAsParentSchema } from "@/modules/communication/application/dto/message.dto";
import type { MessageDTO } from "@/modules/communication/application/dto/message.dto";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import { recordParentActivity } from "./record-parent-activity.helpers";

export interface SendMessageAsParentContext {
  tenantId: string;
  userProfileId: string;
}

// Parent <-> Teacher Messaging (requirement 17), the parent-initiated direction. Reuses the same
// postMessage core send-message-as-teacher.service.ts uses, so both directions share identical
// atomicity/notification behavior.
export async function sendMessageAsParent(
  input: unknown,
  context: SendMessageAsParentContext
): Promise<MessageDTO> {
  const parsed = sendMessageAsParentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid message.");
  }
  const data = parsed.data;

  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, data.studentId);

  const teacherRepository = new PrismaTeacherRepository();
  const teacher = await teacherRepository.findById(context.tenantId, data.teacherId);
  if (!teacher || teacher.deletedAt !== null) {
    throw new TeacherNotFoundError();
  }

  const message = await postMessage({
    tenantId: context.tenantId,
    studentId: data.studentId,
    guardianId: guardian.id,
    teacherId: data.teacherId,
    senderUserProfileId: context.userProfileId,
    senderRole: "PARENT",
    recipientUserProfileId: teacher.userProfileId,
    body: data.body,
    subject: data.subject,
  });

  await recordParentActivity({
    tenantId: context.tenantId,
    guardianId: guardian.id,
    userProfileId: context.userProfileId,
    action: "MESSAGE_SENT",
    entityType: "Message",
    entityId: message.id,
  });

  return message;
}
