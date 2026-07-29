import "server-only";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { resolveGuardianForUserProfile } from "./guardian-access.helpers";
import type { MyChildDTO } from "./dto/my-child.dto";

export interface ListMyChildrenContext {
  tenantId: string;
  userProfileId: string;
}

// Multi-child Support (requirement 22) falls out of the existing StudentGuardian join for free
// (Phase 9 Decision 1) — no new mapping table.
export async function listMyChildren(context: ListMyChildrenContext): Promise<MyChildDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);

  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const links = await studentGuardianRepository.listForGuardian(context.tenantId, guardian.id);

  const studentRepository = new PrismaStudentRepository();
  const students = await Promise.all(
    links.map((link) => studentRepository.findById(context.tenantId, link.studentId))
  );

  const children: MyChildDTO[] = [];
  links.forEach((link, index) => {
    const student = students[index];
    if (!student || student.deletedAt) return;
    children.push({
      studentId: link.studentId,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
      fullName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      photoUrl: student.photoUrl,
    });
  });

  return children;
}
