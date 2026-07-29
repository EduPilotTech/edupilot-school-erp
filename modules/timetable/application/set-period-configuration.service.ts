import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaPeriodConfigurationRepository } from "../infrastructure/prisma-period-configuration.repository";
import { InvalidPeriodConfigurationError } from "../domain/errors";
import { validatePeriods } from "./period-validation.helpers";
import { setPeriodConfigurationSchema } from "./dto/school-config.dto";
import type { PeriodConfigurationDTO } from "./dto/school-config.dto";

export interface SetPeriodConfigurationContext {
  tenantId: string;
  actingUserId: string;
}

function toTimeString(date: Date): string {
  return date.toISOString().slice(11, 16);
}

// Always a full replace of the session's ordered period list in one transaction — matches
// setWorkingDays' own atomic-replace shape. Break periods (Phase 6 Decision 3) are just rows
// with `isBreak: true`; no separate table, no separate validation path.
export async function setPeriodConfiguration(
  input: unknown,
  context: SetPeriodConfigurationContext
): Promise<PeriodConfigurationDTO[]> {
  const parsed = setPeriodConfigurationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid period configuration data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const validationError = validatePeriods(data.periods);
  if (validationError) {
    throw new InvalidPeriodConfigurationError(validationError);
  }

  const repository = new PrismaPeriodConfigurationRepository();

  const results = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const rows: PeriodConfigurationDTO[] = [];
    for (const period of data.periods) {
      const saved = await repository.upsertOne(
        {
          tenantId,
          academicSessionId: data.academicSessionId,
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak,
          updatedBy: actingUserId,
        },
        tx
      );
      rows.push({
        id: saved.id,
        periodNumber: saved.periodNumber,
        startTime: toTimeString(saved.startTime),
        endTime: toTimeString(saved.endTime),
        isBreak: saved.isBreak,
      });
    }
    return rows;
  });

  return results;
}
