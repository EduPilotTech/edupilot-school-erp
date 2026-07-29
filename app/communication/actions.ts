"use server";

// Thin Server Actions only — staff-side Homework/Notice/Calendar/Messaging writes. Teacher-scoped
// actions resolve Teacher.id from the acting UserProfile via PrismaTeacherRepository
// .findByUserProfileId — the same "reach into another module's infrastructure for a simple
// lookup" precedent already established (e.g. add-exam-subject.service.ts importing
// PrismaClassRepository directly).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { TeacherNotFoundError } from "@/modules/teachers/domain/errors";
import { createHomework } from "@/modules/communication/application/create-homework.service";
import { setHomeworkStatus } from "@/modules/communication/application/set-homework-status.service";
import { createNotice } from "@/modules/communication/application/create-notice.service";
import { publishNotice } from "@/modules/communication/application/publish-notice.service";
import { createCalendarEvent } from "@/modules/communication/application/create-calendar-event.service";
import { sendMessageAsTeacher } from "@/modules/communication/application/send-message-as-teacher.service";
import { translateParentError, type ActionResult } from "@/app/parent/_lib/translate-parent-error";
import type { HomeworkDTO, HomeworkStatusDTO } from "@/modules/communication/application/dto/homework.dto";
import type { NoticeDTO } from "@/modules/communication/application/dto/notice.dto";
import type { CalendarItemDTO } from "@/modules/communication/application/dto/calendar-event.dto";
import type { MessageDTO } from "@/modules/communication/application/dto/message.dto";

async function resolveTeacherId(tenantId: string, userProfileId: string): Promise<string> {
  const teacherRepository = new PrismaTeacherRepository();
  const teacher = await teacherRepository.findByUserProfileId(tenantId, userProfileId);
  if (!teacher || teacher.deletedAt !== null) {
    throw new TeacherNotFoundError();
  }
  return teacher.id;
}

export async function createHomeworkAction(input: unknown): Promise<ActionResult<HomeworkDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("communication.homework.manage");

  try {
    const teacherId = await resolveTeacherId(authContext.tenantId, authContext.userId);
    const homework = await createHomework(input, {
      tenantId: authContext.tenantId,
      teacherId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: homework };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function setHomeworkStatusAction(input: unknown): Promise<ActionResult<HomeworkStatusDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("communication.homework.manage");

  try {
    const status = await setHomeworkStatus(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: status };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function createNoticeAction(input: unknown): Promise<ActionResult<NoticeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("communication.notice.manage");

  try {
    const notice = await createNotice(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: notice };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function publishNoticeAction(noticeId: string): Promise<ActionResult<NoticeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("communication.notice.manage");

  try {
    const notice = await publishNotice(noticeId, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: notice };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function createCalendarEventAction(input: unknown): Promise<ActionResult<CalendarItemDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("communication.calendar.manage");

  try {
    const event = await createCalendarEvent(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: event };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function sendMessageAsTeacherAction(input: unknown): Promise<ActionResult<MessageDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("communication.message.send");

  try {
    const teacherId = await resolveTeacherId(authContext.tenantId, authContext.userId);
    const message = await sendMessageAsTeacher(input, {
      tenantId: authContext.tenantId,
      teacherId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: message };
  } catch (error) {
    return translateParentError(error);
  }
}
