import "server-only";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaHomeworkRepository } from "../infrastructure/prisma-homework.repository";
import { PrismaHomeworkStatusRepository } from "../infrastructure/prisma-homework-status.repository";
import { HomeworkNotFoundError } from "../domain/errors";
import { setHomeworkStatusSchema, type HomeworkStatusDTO } from "./dto/homework.dto";

export interface SetHomeworkStatusContext {
  tenantId: string;
  actingUserId: string;
}

// Teacher-set, parent-read-only (Phase 9 Decision 3) — no student upload workflow this phase.
export async function setHomeworkStatus(
  input: unknown,
  context: SetHomeworkStatusContext
): Promise<HomeworkStatusDTO> {
  const parsed = setHomeworkStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid homework status data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const homeworkRepository = new PrismaHomeworkRepository();
  const homework = await homeworkRepository.findById(tenantId, data.homeworkId);
  if (!homework || homework.deletedAt !== null) {
    throw new HomeworkNotFoundError();
  }

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const statusRepository = new PrismaHomeworkStatusRepository();
  const status = await statusRepository.upsert({
    tenantId,
    homeworkId: data.homeworkId,
    studentId: data.studentId,
    status: data.status,
    updatedBy: actingUserId,
  });

  return { id: status.id, homeworkId: status.homeworkId, studentId: status.studentId, status: status.status };
}
