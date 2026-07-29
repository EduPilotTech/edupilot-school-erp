import "server-only";
import { ValidationError } from "@/lib/errors";
import {
  getStudentIdCardSchema,
  type StudentIdCardDTO,
  type StudentIdCardSchoolInfo,
} from "./dto/student-id-card.dto";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { StudentNotFoundError } from "../domain/errors";
import { listStudentDocuments } from "./list-student-documents.service";

export interface GetStudentIdCardContext {
  tenantId: string;
  school: StudentIdCardSchoolInfo;
}

// Sprint 4.9. Reuses existing reads only: StudentRepository.findProfileById (Sprint 4 — Step 6,
// gives student + every enrollment in one query) and listStudentDocuments (Sprint 4.8B, gives
// the PHOTO's signed URL). No new repository method, no schema change — "current enrollment" is
// derived exactly like get-student-profile.service.ts does (the row with `endDate IS NULL`).
export async function getStudentIdCard(
  input: unknown,
  context: GetStudentIdCardContext
): Promise<StudentIdCardDTO> {
  const parsed = getStudentIdCardSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid student id.");
  }
  const { studentId } = parsed.data;
  const { tenantId, school } = context;

  const studentRepository = new PrismaStudentRepository();
  const profile = await studentRepository.findProfileById(tenantId, studentId);

  // Soft-deleted = not found, the same convention every other student-scoped read in this
  // codebase uses (see StudentNotFoundError's own comment).
  if (!profile || profile.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const documents = await listStudentDocuments({ studentId }, { tenantId });
  const photo = documents.find((doc) => doc.documentType === "PHOTO") ?? null;
  const currentEnrollment = profile.enrollments.find((enrollment) => enrollment.endDate === null);

  return {
    student: {
      id: profile.id,
      admissionNumber: profile.admissionNumber,
      fullName: `${profile.firstName} ${profile.lastName}`,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
    },
    academic: currentEnrollment
      ? {
          academicSessionName: currentEnrollment.academicSessionName,
          className: currentEnrollment.className,
          sectionName: currentEnrollment.sectionName,
          rollNumber: currentEnrollment.rollNumber,
        }
      : null,
    photoUrl: photo?.signedUrl ?? null,
    qrValue: profile.id,
    school,
  };
}
