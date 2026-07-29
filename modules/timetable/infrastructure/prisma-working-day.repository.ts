import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, WorkingDay as PrismaWorkingDay } from "@/lib/generated/prisma/client";
import type { UpsertWorkingDayInput, WorkingDayRepository } from "../domain/working-day.repository";
import type { DayOfWeekValue, WorkingDayEntity } from "../domain/working-day.entity";

function toEntity(row: PrismaWorkingDay): WorkingDayEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    dayOfWeek: row.dayOfWeek as DayOfWeekValue,
    isWorking: row.isWorking,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaWorkingDayRepository implements WorkingDayRepository {
  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<WorkingDayEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.workingDay.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { dayOfWeek: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async upsertOne(
    input: UpsertWorkingDayInput,
    tx?: Prisma.TransactionClient
  ): Promise<WorkingDayEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.workingDay.upsert({
          where: {
            tenantId_academicSessionId_dayOfWeek: {
              tenantId: input.tenantId,
              academicSessionId: input.academicSessionId,
              dayOfWeek: input.dayOfWeek,
            },
          },
          create: {
            tenantId: input.tenantId,
            academicSessionId: input.academicSessionId,
            dayOfWeek: input.dayOfWeek,
            isWorking: input.isWorking,
            createdBy: input.updatedBy ?? null,
          },
          update: { isWorking: input.isWorking, updatedBy: input.updatedBy ?? null },
        }),
      tx
    );
    return toEntity(row);
  }
}
