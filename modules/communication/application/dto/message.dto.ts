import { z } from "zod";
import type { MessageSenderRoleValue } from "../../domain/message.entity";

export const sendMessageAsParentSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  teacherId: z.string().uuid("Teacher is required."),
  body: z.string().trim().min(1, "Message cannot be empty.").max(5000),
  subject: z.string().trim().max(200).optional(),
});
export type SendMessageAsParentServiceInput = z.infer<typeof sendMessageAsParentSchema>;

export const sendMessageAsTeacherSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  guardianId: z.string().uuid("Guardian is required."),
  body: z.string().trim().min(1, "Message cannot be empty.").max(5000),
  subject: z.string().trim().max(200).optional(),
});
export type SendMessageAsTeacherServiceInput = z.infer<typeof sendMessageAsTeacherSchema>;

export interface MessageDTO {
  id: string;
  threadId: string;
  senderUserProfileId: string;
  senderRole: MessageSenderRoleValue;
  body: string;
  sentAt: string;
  readAt: string | null;
}

export interface MessageThreadDTO {
  id: string;
  studentId: string;
  guardianId: string;
  teacherId: string;
  subject: string | null;
  isActive: boolean;
  messages: MessageDTO[];
}
