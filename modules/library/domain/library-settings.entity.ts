// One row per Library — loan/renewal/reservation policy, mirrors PeriodConfiguration's own
// settings-table shape (Phase 6 precedent).
export interface LibrarySettingsEntity {
  id: string;
  tenantId: string;
  libraryId: string;
  defaultLoanPeriodDays: number;
  maxBooksStudent: number;
  maxBooksTeacher: number;
  maxBooksStaff: number;
  maxRenewalCount: number;
  reservationHoldDays: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
