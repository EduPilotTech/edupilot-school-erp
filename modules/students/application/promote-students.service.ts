import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSectionRepository } from "@/modules/academics/infrastructure/prisma-section.repository";
import { PrismaEnrollmentRepository } from "../infrastructure/prisma-enrollment.repository";
import {
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
  StudentNotEnrolledInSessionError,
} from "../domain/errors";
import { promoteStudentsSchema, type PromotionResultDTO } from "./dto/promote-students.dto";

export interface PromoteStudentsContext {
  tenantId: string;
  actingUserId: string;
}

// Phase 7 Decision 2: promotion is built entirely on the existing Enrollment.close()+create()
// primitive (see enrollment.repository.ts's own "never overwrite historical enrollment" comment)
// — no Promotion model, no new table. For each student: close their current Enrollment in the
// source session (status COMPLETED) and open a new one in the target session/class/section, both
// inside one transaction per student pair so a batch either fully promotes or fully rolls back —
// same atomic-batch shape as bulk-mark-student-attendance.service.ts.
export async function promoteStudents(
  input: unknown,
  context: PromoteStudentsContext
): Promise<PromotionResultDTO[]> {
  const parsed = promoteStudentsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid promotion data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const targetSession = await sessionRepository.findById(tenantId, data.targetAcademicSessionId);
  if (!targetSession || targetSession.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const classRepository = new PrismaClassRepository();
  const sectionRepository = new PrismaSectionRepository();
  const validatedTargets = new Map<string, void>();

  for (const promotion of data.promotions) {
    const cacheKey = `${promotion.targetClassId}|${promotion.targetSectionId}`;
    if (validatedTargets.has(cacheKey)) {
      continue;
    }
    const targetClass = await classRepository.findById(tenantId, promotion.targetClassId);
    if (!targetClass || targetClass.deletedAt !== null || targetClass.academicSessionId !== targetSession.id) {
      throw new InvalidClassError();
    }
    const targetSection = await sectionRepository.findById(tenantId, promotion.targetSectionId);
    if (!targetSection || targetSection.deletedAt !== null || targetSection.classId !== targetClass.id) {
      throw new InvalidSectionError();
    }
    validatedTargets.set(cacheKey, undefined);
  }

  const enrollmentRepository = new PrismaEnrollmentRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const results: PromotionResultDTO[] = [];
    for (const promotion of data.promotions) {
      const currentEnrollment = await enrollmentRepository.findCurrentForStudent(
        tenantId,
        promotion.studentId,
        data.sourceAcademicSessionId
      );
      if (!currentEnrollment) {
        throw new StudentNotEnrolledInSessionError();
      }

      const closed = await enrollmentRepository.close(
        tenantId,
        currentEnrollment.id,
        new Date(),
        "COMPLETED",
        actingUserId,
        tx
      );

      const created = await enrollmentRepository.create(
        {
          tenantId,
          studentId: promotion.studentId,
          academicSessionId: data.targetAcademicSessionId,
          classId: promotion.targetClassId,
          sectionId: promotion.targetSectionId,
          rollNumber: promotion.rollNumber ?? null,
          startDate: targetSession.startDate,
          createdBy: actingUserId,
        },
        tx
      );

      results.push({
        studentId: promotion.studentId,
        closedEnrollmentId: closed.id,
        newEnrollmentId: created.id,
        targetClassId: promotion.targetClassId,
        targetSectionId: promotion.targetSectionId,
      });
    }
    return results;
  });
}
