import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaHolidayRepository } from "../infrastructure/prisma-holiday.repository";
import { HolidayAlreadyExistsError, HolidayOutsideSessionError } from "../domain/errors";
import { addHolidaySchema } from "./dto/school-config.dto";
import type { HolidayDTO } from "./dto/school-config.dto";

export interface AddHolidayContext {
  tenantId: string;
  actingUserId: string;
}

// Service-layer pre-check (friendly message) backstopped by the DB's own
// `@@unique([tenantId, academicSessionId, date])` constraint (P2002 fallback) — same two-layer
// guarantee pattern used throughout this codebase.
export async function addHoliday(input: unknown, context: AddHolidayContext): Promise<HolidayDTO> {
  const parsed = addHolidaySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid holiday data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }
  if (data.date.getTime() < session.startDate.getTime() || data.date.getTime() > session.endDate.getTime()) {
    throw new HolidayOutsideSessionError();
  }

  const repository = new PrismaHolidayRepository();
  const existing = await repository.findByDate(tenantId, data.academicSessionId, data.date);
  if (existing) {
    throw new HolidayAlreadyExistsError();
  }

  try {
    const holiday = await repository.create({
      tenantId,
      academicSessionId: data.academicSessionId,
      date: data.date,
      name: data.name,
      createdBy: actingUserId,
    });
    return { id: holiday.id, date: holiday.date, name: holiday.name };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HolidayAlreadyExistsError();
    }
    throw error;
  }
}
