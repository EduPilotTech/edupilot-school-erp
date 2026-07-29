import { z } from "zod";
import type { CalendarEventTypeValue } from "../../domain/calendar-event.entity";

export const createCalendarEventSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(5000).optional(),
  eventType: z.enum(["EXAM", "PTM", "EVENT", "OTHER"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});
export type CreateCalendarEventServiceInput = z.infer<typeof createCalendarEventSchema>;

// A single, unified shape for both sourced kinds of calendar item (Phase 9 Decision 7) — `source`
// distinguishes an existing Holiday row from a new CalendarEvent row, but the parent/staff-facing
// UI renders them identically.
export interface CalendarItemDTO {
  id: string;
  source: "HOLIDAY" | "EVENT";
  title: string;
  description: string | null;
  eventType: CalendarEventTypeValue | "HOLIDAY";
  startDate: string;
  endDate: string | null;
}
