import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaCalendarEventRepository } from "../infrastructure/prisma-calendar-event.repository";
import { createCalendarEventSchema } from "./dto/calendar-event.dto";
import type { CalendarItemDTO } from "./dto/calendar-event.dto";
import type { CalendarEventEntity } from "../domain/calendar-event.entity";

export interface CreateCalendarEventContext {
  tenantId: string;
  actingUserId: string;
}

export function toCalendarItemDTO(entity: CalendarEventEntity): CalendarItemDTO {
  return {
    id: entity.id,
    source: "EVENT",
    title: entity.title,
    description: entity.description,
    eventType: entity.eventType,
    startDate: entity.startDate.toISOString().slice(0, 10),
    endDate: entity.endDate ? entity.endDate.toISOString().slice(0, 10) : null,
  };
}

// School Calendar (requirement 15) — everything that ISN'T a Holiday (see get-school-calendar
// .service.ts for the composition with the existing Holiday model, Phase 9 Decision 7).
export async function createCalendarEvent(
  input: unknown,
  context: CreateCalendarEventContext
): Promise<CalendarItemDTO> {
  const parsed = createCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid calendar event data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const repository = new PrismaCalendarEventRepository();
  const event = await repository.create({
    tenantId,
    academicSessionId: data.academicSessionId,
    title: data.title,
    description: data.description ?? null,
    eventType: data.eventType,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    createdBy: actingUserId,
  });

  return toCalendarItemDTO(event);
}
