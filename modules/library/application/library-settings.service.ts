import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaLibraryRepository } from "../infrastructure/prisma-library.repository";
import { PrismaLibrarySettingsRepository } from "../infrastructure/prisma-library-settings.repository";
import { LibraryNotFoundError } from "../domain/errors";
import { upsertLibrarySettingsSchema, type LibrarySettingsDTO } from "./dto/library.dto";
import type { LibrarySettingsEntity } from "../domain/library-settings.entity";
import type { LibraryContext } from "./library.service";

function toDTO(entity: LibrarySettingsEntity): LibrarySettingsDTO {
  return {
    id: entity.id,
    libraryId: entity.libraryId,
    defaultLoanPeriodDays: entity.defaultLoanPeriodDays,
    maxBooksStudent: entity.maxBooksStudent,
    maxBooksTeacher: entity.maxBooksTeacher,
    maxBooksStaff: entity.maxBooksStaff,
    maxRenewalCount: entity.maxRenewalCount,
    reservationHoldDays: entity.reservationHoldDays,
  };
}

// Defaults used whenever a Library has no settings row yet — a librarian can always fall back to
// these sane defaults rather than being blocked from issuing books until they configure settings.
const DEFAULT_SETTINGS = {
  defaultLoanPeriodDays: 14,
  maxBooksStudent: 3,
  maxBooksTeacher: 5,
  maxBooksStaff: 5,
  maxRenewalCount: 2,
  reservationHoldDays: 2,
};

export async function getLibrarySettings(tenantId: string, libraryId: string): Promise<LibrarySettingsDTO> {
  const repository = new PrismaLibrarySettingsRepository();
  const settings = await repository.findByLibrary(tenantId, libraryId);
  if (settings) return toDTO(settings);
  return { id: "", libraryId, ...DEFAULT_SETTINGS };
}

export async function upsertLibrarySettings(
  libraryId: string,
  input: unknown,
  context: LibraryContext
): Promise<LibrarySettingsDTO> {
  const parsed = upsertLibrarySettingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid library settings.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const libraryRepository = new PrismaLibraryRepository();
  const library = await libraryRepository.findById(tenantId, libraryId);
  if (!library || library.deletedAt !== null) {
    throw new LibraryNotFoundError();
  }

  const repository = new PrismaLibrarySettingsRepository();
  const existing = await repository.findByLibrary(tenantId, libraryId);

  const settings = existing
    ? await repository.update(tenantId, libraryId, { ...data, updatedBy: actingUserId })
    : await repository.create({ tenantId, libraryId, ...data, createdBy: actingUserId });

  return toDTO(settings);
}
