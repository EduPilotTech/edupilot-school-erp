import "server-only";
import { PrismaHomeworkRepository } from "../infrastructure/prisma-homework.repository";
import { toHomeworkDTO } from "./create-homework.service";
import type { HomeworkDTO } from "./dto/homework.dto";

export async function listHomeworkForClass(
  tenantId: string,
  classId: string,
  sectionId?: string | null
): Promise<HomeworkDTO[]> {
  const repository = new PrismaHomeworkRepository();
  const items = await repository.findByClass(tenantId, classId, sectionId);
  return items.map(toHomeworkDTO);
}

export async function listHomeworkForTeacher(tenantId: string, teacherId: string): Promise<HomeworkDTO[]> {
  const repository = new PrismaHomeworkRepository();
  const items = await repository.findByTeacher(tenantId, teacherId);
  return items.map(toHomeworkDTO);
}
