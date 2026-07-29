import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, PeriodConfiguration as PrismaPeriodConfiguration } from "@/lib/generated/prisma/client";
import type {
  PeriodConfigurationRepository,
  UpsertPeriodConfigurationInput,
} from "../domain/period-configuration.repository";
import type { PeriodConfigurationEntity } from "../domain/period-configuration.entity";

function toEntity(row: PrismaPeriodConfiguration): PeriodConfigurationEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    periodNumber: row.periodNumber,
    startTime: row.startTime,
    endTime: row.endTime,
    isBreak: row.isBreak,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPeriodConfigurationRepository implements PeriodConfigurationRepository {
  async findByAcademicSession(
    tenantId: string,
    academicSessionId: string
  ): Promise<PeriodConfigurationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.periodConfiguration.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { periodNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findById(tenantId: string, id: string): Promise<PeriodConfigurationEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.periodConfiguration.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async upsertOne(
    input: UpsertPeriodConfigurationInput,
    tx?: Prisma.TransactionClient
  ): Promise<PeriodConfigurationEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.periodConfiguration.upsert({
          where: {
            tenantId_academicSessionId_periodNumber: {
              tenantId: input.tenantId,
              academicSessionId: input.academicSessionId,
              periodNumber: input.periodNumber,
            },
          },
          create: {
            tenantId: input.tenantId,
            academicSessionId: input.academicSessionId,
            periodNumber: input.periodNumber,
            startTime: input.startTime,
            endTime: input.endTime,
            isBreak: input.isBreak,
            createdBy: input.updatedBy ?? null,
          },
          update: {
            startTime: input.startTime,
            endTime: input.endTime,
            isBreak: input.isBreak,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
