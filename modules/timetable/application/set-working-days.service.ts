import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaWorkingDayRepository } from "../infrastructure/prisma-working-day.repository";
import { NoWorkingDaysError } from "../domain/errors";
import { setWorkingDaysSchema } from "./dto/school-config.dto";
import type { WorkingDayDTO } from "./dto/school-config.dto";

export interface SetWorkingDaysContext {
  tenantId: string;
  actingUserId: string;
}

// Always a full replace of the session's 7-day pattern in one transaction — matches
// bulk-mark-student-attendance.service.ts's own atomic-replace precedent.
export async function setWorkingDays(input: unknown, context: SetWorkingDaysContext): Promise<WorkingDayDTO[]> {
  const parsed = setWorkingDaysSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid working days data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  if (!data.days.some((day) => day.isWorking)) {
    throw new NoWorkingDaysError();
  }

  const repository = new PrismaWorkingDayRepository();

  const results = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const rows: WorkingDayDTO[] = [];
    for (const day of data.days) {
      const workingDay = await repository.upsertOne(
        {
          tenantId,
          academicSessionId: data.academicSessionId,
          dayOfWeek: day.dayOfWeek,
          isWorking: day.isWorking,
          updatedBy: actingUserId,
        },
        tx
      );
      rows.push({ dayOfWeek: workingDay.dayOfWeek, isWorking: workingDay.isWorking });
    }
    return rows;
  });

  return results;
}
