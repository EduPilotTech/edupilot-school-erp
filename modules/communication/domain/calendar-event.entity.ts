export type CalendarEventTypeValue = "EXAM" | "PTM" | "EVENT" | "OTHER";

// The School Calendar (requirement 15) is composed at READ time from this model UNIONed with the
// existing Holiday model (Phase 9 Decision 7) — a holiday is never duplicated into
// CalendarEvent, which is why there is no HOLIDAY value in CalendarEventTypeValue.
export interface CalendarEventEntity {
  id: string;
  tenantId: string;
  academicSessionId: string;
  title: string;
  description: string | null;
  eventType: CalendarEventTypeValue;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
