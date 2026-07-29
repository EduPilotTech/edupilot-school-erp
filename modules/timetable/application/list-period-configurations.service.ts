import "server-only";
import { PrismaPeriodConfigurationRepository } from "../infrastructure/prisma-period-configuration.repository";
import type { PeriodConfigurationDTO } from "./dto/school-config.dto";

function toTimeString(date: Date): string {
  return date.toISOString().slice(11, 16);
}

export async function listPeriodConfigurations(
  academicSessionId: string,
  context: { tenantId: string }
): Promise<PeriodConfigurationDTO[]> {
  const repository = new PrismaPeriodConfigurationRepository();
  const periods = await repository.findByAcademicSession(context.tenantId, academicSessionId);
  return periods.map((period) => ({
    id: period.id,
    periodNumber: period.periodNumber,
    startTime: toTimeString(period.startTime),
    endTime: toTimeString(period.endTime),
    isBreak: period.isBreak,
  }));
}
