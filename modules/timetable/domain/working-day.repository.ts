import type { Prisma } from "@/lib/generated/prisma/client";
import type { DayOfWeekValue, WorkingDayEntity } from "./working-day.entity";

export interface UpsertWorkingDayInput {
  tenantId: string;
  academicSessionId: string;
  dayOfWeek: DayOfWeekValue;
  isWorking: boolean;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6 — no ambient tenant
// context, never trusted from a caller's request. `upsertOne` (not create/update separately)
// because "set working days" is always a full replace of the session's 7-day pattern, matching
// the upsert-based correction convention established by modules/attendance's `markOne`.
export interface WorkingDayRepository {
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<WorkingDayEntity[]>;
  upsertOne(input: UpsertWorkingDayInput, tx?: Prisma.TransactionClient): Promise<WorkingDayEntity>;
}
