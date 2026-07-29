import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { CalendarEvent as PrismaCalendarEvent } from "@/lib/generated/prisma/client";
import type { CalendarEventRepository, CreateCalendarEventInput } from "../domain/calendar-event.repository";
import type { CalendarEventEntity, CalendarEventTypeValue } from "../domain/calendar-event.entity";

function toEntity(row: PrismaCalendarEvent): CalendarEventEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    title: row.title,
    description: row.description,
    eventType: row.eventType as CalendarEventTypeValue,
    startDate: row.startDate,
    endDate: row.endDate,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaCalendarEventRepository implements CalendarEventRepository {
  async findById(tenantId: string, id: string): Promise<CalendarEventEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.calendarEvent.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(
    tenantId: string,
    academicSessionId: string,
    from?: Date,
    to?: Date
  ): Promise<CalendarEventEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.calendarEvent.findMany({
        where: {
          tenantId,
          academicSessionId,
          deletedAt: null,
          isActive: true,
          ...(from || to
            ? {
                startDate: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
        orderBy: { startDate: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateCalendarEventInput): Promise<CalendarEventEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.calendarEvent.create({
        data: {
          tenantId: input.tenantId,
          academicSessionId: input.academicSessionId,
          title: input.title,
          description: input.description ?? null,
          eventType: input.eventType,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<CalendarEventEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.calendarEvent.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
