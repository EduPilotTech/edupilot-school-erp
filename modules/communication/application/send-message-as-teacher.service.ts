import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { GuardianNotFoundError } from "@/modules/parents/domain/errors";
import { postMessage } from "./post-message.helpers";
import { sendMessageAsTeacherSchema } from "./dto/message.dto";
import type { MessageDTO } from "./dto/message.dto";

export interface SendMessageAsTeacherContext {
  tenantId: string;
  teacherId: string;
  actingUserId: string;
}

export async function sendMessageAsTeacher(
  input: unknown,
  context: SendMessageAsTeacherContext
): Promise<MessageDTO> {
  const parsed = sendMessageAsTeacherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid message.");
  }
  const data = parsed.data;

  const guardianRepository = new PrismaGuardianRepository();
  const guardian = await guardianRepository.findById(context.tenantId, data.guardianId);
  if (!guardian || guardian.deletedAt !== null || !guardian.userProfileId) {
    throw new GuardianNotFoundError();
  }

  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const link = await studentGuardianRepository.findByStudentAndGuardian(
    context.tenantId,
    data.studentId,
    data.guardianId
  );
  if (!link) {
    throw new ValidationError("This guardian is not linked to the selected student.");
  }

  return postMessage({
    tenantId: context.tenantId,
    studentId: data.studentId,
    guardianId: data.guardianId,
    teacherId: context.teacherId,
    senderUserProfileId: context.actingUserId,
    senderRole: "TEACHER",
    recipientUserProfileId: guardian.userProfileId,
    body: data.body,
    subject: data.subject,
  });
}
