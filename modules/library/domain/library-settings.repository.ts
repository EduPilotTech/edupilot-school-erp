import type { LibrarySettingsEntity } from "./library-settings.entity";

export interface CreateLibrarySettingsInput {
  tenantId: string;
  libraryId: string;
  defaultLoanPeriodDays?: number;
  maxBooksStudent?: number;
  maxBooksTeacher?: number;
  maxBooksStaff?: number;
  maxRenewalCount?: number;
  reservationHoldDays?: number;
  createdBy?: string | null;
}

export interface UpdateLibrarySettingsInput {
  defaultLoanPeriodDays?: number;
  maxBooksStudent?: number;
  maxBooksTeacher?: number;
  maxBooksStaff?: number;
  maxRenewalCount?: number;
  reservationHoldDays?: number;
  updatedBy?: string | null;
}

export interface LibrarySettingsRepository {
  findByLibrary(tenantId: string, libraryId: string): Promise<LibrarySettingsEntity | null>;
  create(input: CreateLibrarySettingsInput): Promise<LibrarySettingsEntity>;
  update(tenantId: string, libraryId: string, input: UpdateLibrarySettingsInput): Promise<LibrarySettingsEntity>;
}
