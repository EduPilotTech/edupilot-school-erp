// `startTime`/`endTime` are Postgres `TIME` values (no date component) — Prisma represents these
// as `Date` objects with an arbitrary date part; only the time-of-day portion is meaningful.
export interface PeriodConfigurationEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  periodNumber: number;
  startTime: Date;
  endTime: Date;
  isBreak: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
