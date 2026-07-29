import "server-only";
import { PrismaHolidayRepository } from "../infrastructure/prisma-holiday.repository";
import { HolidayNotFoundError } from "../domain/errors";

export async function removeHoliday(
  holidayId: string,
  context: { tenantId: string; actingUserId: string }
): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHolidayRepository();
  const existing = await repository.findById(tenantId, holidayId);
  if (!existing || existing.deletedAt !== null) {
    throw new HolidayNotFoundError();
  }
  await repository.softDelete(tenantId, holidayId, actingUserId);
}
