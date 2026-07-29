import "server-only";
import { PrismaHolidayRepository } from "@/modules/timetable/infrastructure/prisma-holiday.repository";
import { PrismaCalendarEventRepository } from "../infrastructure/prisma-calendar-event.repository";
import { toCalendarItemDTO } from "./create-calendar-event.service";
import type { CalendarItemDTO } from "./dto/calendar-event.dto";

// Composed at READ time from the existing Holiday model (Phase 6) UNIONed with new
// CalendarEvent rows (Phase 9 Decision 7) — a holiday is never duplicated into CalendarEvent.
export async function getSchoolCalendar(tenantId: string, academicSessionId: string): Promise<CalendarItemDTO[]> {
  const holidayRepository = new PrismaHolidayRepository();
  const calendarEventRepository = new PrismaCalendarEventRepository();

  const [holidays, events] = await Promise.all([
    holidayRepository.findByAcademicSession(tenantId, academicSessionId),
    calendarEventRepository.findByAcademicSession(tenantId, academicSessionId),
  ]);

  const holidayItems: CalendarItemDTO[] = holidays
    .filter((holiday) => holiday.isActive && holiday.deletedAt === null)
    .map((holiday) => ({
      id: holiday.id,
      source: "HOLIDAY" as const,
      title: holiday.name,
      description: null,
      eventType: "HOLIDAY" as const,
      startDate: holiday.date.toISOString().slice(0, 10),
      endDate: null,
    }));

  const eventItems = events.map(toCalendarItemDTO);

  return [...holidayItems, ...eventItems].sort((a, b) => a.startDate.localeCompare(b.startDate));
}
