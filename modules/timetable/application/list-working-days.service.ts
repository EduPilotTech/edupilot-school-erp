import "server-only";
import { PrismaWorkingDayRepository } from "../infrastructure/prisma-working-day.repository";
import type { WorkingDayDTO } from "./dto/school-config.dto";

export async function listWorkingDays(
  academicSessionId: string,
  context: { tenantId: string }
): Promise<WorkingDayDTO[]> {
  const repository = new PrismaWorkingDayRepository();
  const days = await repository.findByAcademicSession(context.tenantId, academicSessionId);
  return days.map((day) => ({ dayOfWeek: day.dayOfWeek, isWorking: day.isWorking }));
}
