import "server-only";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { enrichTimetableEntries } from "./enrich-timetable-entries.helpers";
import type { TimetableGridEntryDTO } from "./dto/timetable-grid.dto";

// Pure read, no Server Action — matches every other report/print view in this codebase
// (modules/attendance's report services, list-teachers.service.ts).
export async function getClassTimetable(
  classId: string,
  sectionId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<TimetableGridEntryDTO[]> {
  const repository = new PrismaTimetableEntryRepository();
  const entries = await repository.findByClass(context.tenantId, classId, sectionId, academicSessionId);
  return enrichTimetableEntries(context.tenantId, entries);
}
