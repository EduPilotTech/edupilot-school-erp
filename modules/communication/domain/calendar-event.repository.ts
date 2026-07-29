import type { CalendarEventEntity, CalendarEventTypeValue } from "./calendar-event.entity";

export interface CreateCalendarEventInput {
  tenantId: string;
  academicSessionId: string;
  title: string;
  description?: string | null;
  eventType: CalendarEventTypeValue;
  startDate: Date;
  endDate?: Date | null;
  createdBy?: string | null;
}

export interface CalendarEventRepository {
  findById(tenantId: string, id: string): Promise<CalendarEventEntity | null>;
  findByAcademicSession(
    tenantId: string,
    academicSessionId: string,
    from?: Date,
    to?: Date
  ): Promise<CalendarEventEntity[]>;
  create(input: CreateCalendarEventInput): Promise<CalendarEventEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<CalendarEventEntity>;
}
