import "server-only";
import { PrismaGradeScaleRepository } from "../infrastructure/prisma-grade-scale.repository";
import { PrismaGradeBandRepository } from "../infrastructure/prisma-grade-band.repository";
import type { GradeScaleDTO } from "./dto/grade-scale.dto";

// Read-only — every GradeScale for a session, each joined with its own band list, for the Grade
// System settings page.
export async function listGradeScales(
  academicSessionId: string,
  context: { tenantId: string }
): Promise<GradeScaleDTO[]> {
  const scaleRepository = new PrismaGradeScaleRepository();
  const bandRepository = new PrismaGradeBandRepository();

  const scales = await scaleRepository.findByAcademicSession(context.tenantId, academicSessionId);

  return Promise.all(
    scales.map(async (scale) => {
      const bands = await bandRepository.findByGradeScale(context.tenantId, scale.id);
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
    })
  );
}
