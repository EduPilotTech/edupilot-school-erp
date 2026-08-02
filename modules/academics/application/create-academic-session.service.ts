import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaAcademicSessionRepository } from "../infrastructure/prisma-academic-session.repository";
import { createAcademicSessionSchema, type AcademicSessionDTO } from "./dto/academic-session.dto";
import type { AcademicSessionEntity } from "../domain/academic-session.entity";

export interface CreateAcademicSessionContext {
  tenantId: string;
  schoolId: string;
  actingUserId: string;
}

function toDTO(entity: AcademicSessionEntity): AcademicSessionDTO {
  return {
    id: entity.id,
    sessionName: entity.sessionName,
    startDate: entity.startDate.toISOString(),
    endDate: entity.endDate.toISOString(),
    isCurrent: entity.isCurrent,
    status: entity.status,
  };
}

// Academic Setup — the first step of the "create a session, then classes, then sections" flow a
// new school needs before Student Admission's dropdowns have anything to show. No duplicate-name
// check: unlike Class/Section, AcademicSession has no unique DB constraint on sessionName (a
// school legitimately might reuse a label across non-overlapping date ranges).
export async function createAcademicSession(
  input: unknown,
  context: CreateAcademicSessionContext
): Promise<AcademicSessionDTO> {
  const parsed = createAcademicSessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid academic session data.");
  }
  const data = parsed.data;

  const repository = new PrismaAcademicSessionRepository();
  const session = await repository.create({
    tenantId: context.tenantId,
    schoolId: context.schoolId,
    sessionName: data.sessionName,
    startDate: data.startDate,
    endDate: data.endDate,
    createdBy: context.actingUserId,
  });

  return toDTO(session);
}
