import "server-only";
import { ValidationError } from "@/lib/errors";
import { getStudentProfileSchema, type StudentProfileDTO } from "./dto/student-profile.dto";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { StudentNotFoundError } from "../domain/errors";

export interface GetStudentProfileContext {
  tenantId: string;
}

function calculateAge(dateOfBirth: Date, asOf = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthdayThisYear =
    asOf.getMonth() > dateOfBirth.getMonth() ||
    (asOf.getMonth() === dateOfBirth.getMonth() && asOf.getDate() >= dateOfBirth.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

// Sprint 4 — Step 6. Fetches the complete Student Profile for app/students/[studentId]/page.tsx.
// Validates the id, enforces tenant isolation (via PrismaStudentRepository.findProfileById's
// tenantId scoping) and soft-delete-as-not-found, then maps the raw StudentProfileEntity into
// the page-ready StudentProfileDTO — computing `age`/`fullName`, deriving the current enrollment
// for Academic Information, and marking the sections this sprint has no schema for (Medical,
// Documents, full Activity history) as unavailable rather than silently empty.
export async function getStudentProfile(
  input: unknown,
  context: GetStudentProfileContext
): Promise<StudentProfileDTO> {
  const parsed = getStudentProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid student id.");
  }

  const repository = new PrismaStudentRepository();
  const profile = await repository.findProfileById(context.tenantId, parsed.data.studentId);

  // Soft-deleted students are treated as not found, not given a distinct response — see
  // StudentNotFoundError's own comment for why.
  if (!profile || profile.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const currentEnrollment = profile.enrollments.find((enrollment) => enrollment.endDate === null);

  const activityEvents: StudentProfileDTO["activityTimeline"]["events"] = [
    { label: "Admission Created", timestamp: profile.createdAt },
  ];
  if (profile.updatedAt.getTime() !== profile.createdAt.getTime()) {
    activityEvents.push({ label: "Profile Updated", timestamp: profile.updatedAt });
  }

  return {
    student: {
      id: profile.id,
      admissionNumber: profile.admissionNumber,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: `${profile.firstName} ${profile.lastName}`,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      age: calculateAge(profile.dateOfBirth),
      photoUrl: profile.photoUrl,
      status: profile.status,
    },
    academic: currentEnrollment
      ? {
          academicSessionName: currentEnrollment.academicSessionName,
          className: currentEnrollment.className,
          sectionName: currentEnrollment.sectionName,
          rollNumber: currentEnrollment.rollNumber,
          admissionDate: profile.admissionDate,
        }
      : null,
    guardians: profile.guardians.map((guardian) => ({
      id: guardian.id,
      relationship: guardian.relationship,
      isPrimary: guardian.isPrimary,
      fullName: guardian.fullName,
      occupation: guardian.occupation,
      phone: guardian.phone,
    })),
    address: {
      current: {
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        postalCode: profile.postalCode,
      },
      permanentAvailable: false,
    },
    medical: { available: false, items: [] },
    documents: { available: false, items: [] },
    enrollmentHistory: profile.enrollments.map((enrollment) => ({
      id: enrollment.id,
      academicSessionName: enrollment.academicSessionName,
      className: enrollment.className,
      sectionName: enrollment.sectionName,
      rollNumber: enrollment.rollNumber,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      status: enrollment.status,
      isCurrent: enrollment.endDate === null,
    })),
    activityTimeline: { available: false, events: activityEvents },
  };
}
