import "server-only";
import { PrismaHolidayRepository } from "../infrastructure/prisma-holiday.repository";
import type { HolidayDTO } from "./dto/school-config.dto";

export async function listHolidays(
  academicSessionId: string,
  context: { tenantId: string }
): Promise<HolidayDTO[]> {
  const repository = new PrismaHolidayRepository();
  const holidays = await repository.findByAcademicSession(context.tenantId, academicSessionId);
  return holidays.map((holiday) => ({ id: holiday.id, date: holiday.date, name: holiday.name }));
}
