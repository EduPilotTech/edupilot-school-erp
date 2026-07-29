export type DayOfWeekValue =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

// One row per weekday per AcademicSession (all 7 always exist once configured — see
// prisma/schema.prisma's WorkingDay comment for why absence-checking was rejected in favor of
// a lookup). `isWorking` is the domain toggle; `isActive`/`deletedAt` are the standard
// soft-delete-record pair applied uniformly across Phase 6 master data.
export interface WorkingDayEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  dayOfWeek: DayOfWeekValue;
  isWorking: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
