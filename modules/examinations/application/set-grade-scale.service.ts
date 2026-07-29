import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaGradeScaleRepository } from "../infrastructure/prisma-grade-scale.repository";
import { PrismaGradeBandRepository } from "../infrastructure/prisma-grade-band.repository";
import { InvalidGradeBandsError } from "../domain/errors";
import { validateGradeBands } from "./grade-band-validation.helpers";
import { setGradeScaleSchema, type GradeScaleDTO } from "./dto/grade-scale.dto";

export interface SetGradeScaleContext {
  tenantId: string;
  actingUserId: string;
}

// Creates the named GradeScale if it doesn't exist yet, then always fully replaces its band list
// in the same transaction — matches setWorkingDays/setPeriodConfiguration's own "always a full
// replace" shape (Phase 7 Decision 7: validated with a helper mirroring
// period-validation.helpers.ts).
export async function setGradeScale(input: unknown, context: SetGradeScaleContext): Promise<GradeScaleDTO> {
  const parsed = setGradeScaleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid grade scale data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const validationError = validateGradeBands(data.bands);
  if (validationError) {
    throw new InvalidGradeBandsError(validationError);
  }

  const scaleRepository = new PrismaGradeScaleRepository();
  const bandRepository = new PrismaGradeBandRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    let scale = await scaleRepository.findByName(tenantId, data.academicSessionId, data.name);
    if (!scale) {
      scale = await scaleRepository.create(
        {
          tenantId,
          academicSessionId: data.academicSessionId,
          name: data.name,
          createdBy: actingUserId,
        },
        tx
      );
    }

    const bands = await bandRepository.replaceAll(
      tenantId,
      scale.id,
      data.bands.map((band) => ({
        minPercentage: band.minPercentage,
        maxPercentage: band.maxPercentage,
        grade: band.grade,
        gradePoint: band.gradePoint ?? null,
      })),
      actingUserId,
      tx
    );

    return {
      id: scale.id,
      academicSessionId: scale.academicSessionId,
      name: scale.name,
      bands: bands.map((band) => ({
        minPercentage: band.minPercentage,
        maxPercentage: band.maxPercentage,
        grade: band.grade,
        gradePoint: band.gradePoint,
      })),
    };
  });
}
