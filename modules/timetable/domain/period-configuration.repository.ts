import type { Prisma } from "@/lib/generated/prisma/client";
import type { PeriodConfigurationEntity } from "./period-configuration.entity";

export interface UpsertPeriodConfigurationInput {
  tenantId: string;
  academicSessionId: string;
  periodNumber: number;
  startTime: Date;
  endTime: Date;
  isBreak: boolean;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6. `upsertOne` (not
// create/update separately) because "set period configuration" is always a full replace of the
// session's ordered period list, matching WorkingDayRepository's own upsert-based shape.
export interface PeriodConfigurationRepository {
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<PeriodConfigurationEntity[]>;
  findById(tenantId: string, id: string): Promise<PeriodConfigurationEntity | null>;
  upsertOne(
    input: UpsertPeriodConfigurationInput,
    tx?: Prisma.TransactionClient
  ): Promise<PeriodConfigurationEntity>;
}
