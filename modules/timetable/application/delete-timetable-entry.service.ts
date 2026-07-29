import "server-only";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { TimetableEntryNotFoundError } from "../domain/errors";

// Hard delete — clears the slot entirely. See TimetableEntry's own schema comment for why no
// soft-delete/deletedAt is used here.
export async function deleteTimetableEntry(
  entryId: string,
  context: { tenantId: string }
): Promise<void> {
  const repository = new PrismaTimetableEntryRepository();
  const existing = await repository.findById(context.tenantId, entryId);
  if (!existing) {
    throw new TimetableEntryNotFoundError();
  }
  await repository.delete(context.tenantId, entryId);
}
