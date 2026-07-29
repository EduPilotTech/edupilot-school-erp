import "server-only";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { enrichTimetableEntries } from "./enrich-timetable-entries.helpers";
import type { TimetableGridEntryDTO } from "./dto/timetable-grid.dto";

export async function getTeacherTimetable(
  teacherId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<TimetableGridEntryDTO[]> {
  const repository = new PrismaTimetableEntryRepository();
  const entries = await repository.findByTeacher(context.tenantId, teacherId, academicSessionId);
  return enrichTimetableEntries(context.tenantId, entries);
}
