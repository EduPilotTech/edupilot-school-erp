import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { LibrarySettings as PrismaLibrarySettings } from "@/lib/generated/prisma/client";
import type {
  CreateLibrarySettingsInput,
  LibrarySettingsRepository,
  UpdateLibrarySettingsInput,
} from "../domain/library-settings.repository";
import type { LibrarySettingsEntity } from "../domain/library-settings.entity";

function toEntity(row: PrismaLibrarySettings): LibrarySettingsEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    libraryId: row.libraryId,
    defaultLoanPeriodDays: row.defaultLoanPeriodDays,
    maxBooksStudent: row.maxBooksStudent,
    maxBooksTeacher: row.maxBooksTeacher,
    maxBooksStaff: row.maxBooksStaff,
    maxRenewalCount: row.maxRenewalCount,
    reservationHoldDays: row.reservationHoldDays,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaLibrarySettingsRepository implements LibrarySettingsRepository {
  async findByLibrary(tenantId: string, libraryId: string): Promise<LibrarySettingsEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.librarySettings.findUnique({ where: { tenantId_libraryId: { tenantId, libraryId } } })
    );
    return row ? toEntity(row) : null;
  }

  async create(input: CreateLibrarySettingsInput): Promise<LibrarySettingsEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.librarySettings.create({
        data: {
          tenantId: input.tenantId,
          libraryId: input.libraryId,
          defaultLoanPeriodDays: input.defaultLoanPeriodDays,
          maxBooksStudent: input.maxBooksStudent,
          maxBooksTeacher: input.maxBooksTeacher,
          maxBooksStaff: input.maxBooksStaff,
          maxRenewalCount: input.maxRenewalCount,
          reservationHoldDays: input.reservationHoldDays,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, libraryId: string, input: UpdateLibrarySettingsInput): Promise<LibrarySettingsEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.librarySettings.update({
        where: { tenantId_libraryId: { tenantId, libraryId } },
        data: {
          defaultLoanPeriodDays: input.defaultLoanPeriodDays,
          maxBooksStudent: input.maxBooksStudent,
          maxBooksTeacher: input.maxBooksTeacher,
          maxBooksStaff: input.maxBooksStaff,
          maxRenewalCount: input.maxRenewalCount,
          reservationHoldDays: input.reservationHoldDays,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }
}
