import "server-only";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { ParentAccountNotFoundError, StudentNotLinkedToGuardianError } from "../domain/errors";
import type { GuardianEntity } from "@/modules/students/domain/guardian.entity";

// Every parent-facing read service starts here — resolves "which Guardian is this signed-in
// UserProfile" via the additive Guardian.userProfileId link (Phase 9 Decision 1).
export async function resolveGuardianForUserProfile(
  tenantId: string,
  userProfileId: string
): Promise<GuardianEntity> {
  const guardianRepository = new PrismaGuardianRepository();
  const guardian = await guardianRepository.findByUserProfileId(tenantId, userProfileId);
  if (!guardian) {
    throw new ParentAccountNotFoundError();
  }
  return guardian;
}

// RBAC alone can never express row-level scoping ("PARENT can view attendance" says nothing
// about *whose*) — this is the narrower, service-layer check every parent-facing read service in
// this module calls before touching Attendance/Exam/Fee data, the same discipline
// marks-authorization.helpers.ts established for teachers in Phase 7.
export async function assertGuardianCanAccessStudent(
  tenantId: string,
  guardianId: string,
  studentId: string
): Promise<void> {
  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const link = await studentGuardianRepository.findByStudentAndGuardian(tenantId, studentId, guardianId);
  if (!link) {
    throw new StudentNotLinkedToGuardianError();
  }
}
