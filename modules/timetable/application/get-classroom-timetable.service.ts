import "server-only";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { enrichTimetableEntries } from "./enrich-timetable-entries.helpers";
import type { TimetableGridEntryDTO } from "./dto/timetable-grid.dto";

export async function getClassroomTimetable(
  classroomId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<TimetableGridEntryDTO[]> {
  const repository = new PrismaTimetableEntryRepository();
  const entries = await repository.findByClassroom(context.tenantId, classroomId, academicSessionId);
  return enrichTimetableEntries(context.tenantId, entries);
}
