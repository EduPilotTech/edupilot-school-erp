import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Holiday as PrismaHoliday } from "@/lib/generated/prisma/client";
import type { CreateHolidayInput, HolidayRepository } from "../domain/holiday.repository";
import type { HolidayEntity } from "../domain/holiday.entity";

function toEntity(row: PrismaHoliday): HolidayEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    date: row.date,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHolidayRepository implements HolidayRepository {
  async findById(tenantId: string, id: string): Promise<HolidayEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.holiday.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<HolidayEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.holiday.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { date: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByDate(tenantId: string, academicSessionId: string, date: Date): Promise<HolidayEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.holiday.findUnique({
        where: { tenantId_academicSessionId_date: { tenantId, academicSessionId, date } },
      })
    );
    return row && row.deletedAt === null ? toEntity(row) : null;
  }

  async create(input: CreateHolidayInput): Promise<HolidayEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.holiday.create({
        data: {
          tenantId: input.tenantId,
          academicSessionId: input.academicSessionId,
          date: input.date,
          name: input.name,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HolidayEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.holiday.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
