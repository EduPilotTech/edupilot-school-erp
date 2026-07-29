import "server-only";
import { PrismaEnrollmentRepository } from "../infrastructure/prisma-enrollment.repository";
import type { EnrollmentEntity } from "../domain/enrollment.entity";

// Read-only — the application-layer entry point other modules must go through to reach
// EnrollmentRepository (docs/PROJECT_ARCHITECTURE.md §6: cross-module access never reaches into
// another module's infrastructure layer directly). Added for Phase 7's result generation, which
// needs a student's own classId/sectionId, not just the display names Student List's read model
// carries.
export async function listCurrentEnrollmentsForClass(
  classId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<EnrollmentEntity[]> {
  const repository = new PrismaEnrollmentRepository();
  return repository.findCurrentForClass(context.tenantId, classId, academicSessionId);
}

export async function getCurrentEnrollmentForStudent(
  studentId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<EnrollmentEntity | null> {
  const repository = new PrismaEnrollmentRepository();
  return repository.findCurrentForStudent(context.tenantId, studentId, academicSessionId);
}
