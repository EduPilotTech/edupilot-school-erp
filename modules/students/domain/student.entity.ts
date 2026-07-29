import type { GuardianRelationshipValue } from "./student-guardian.repository";
import type { EnrollmentStatusValue } from "./enrollment.entity";

export type StudentStatusValue = "ACTIVE" | "TRANSFERRED" | "GRADUATED" | "WITHDRAWN";
export type GenderValue = "MALE" | "FEMALE" | "OTHER";

// Domain view of Student, decoupled from Prisma's generated type. Deliberately has no
// `userProfileId` — linking a Student to a UserProfile (future portal access) is explicitly
// deferred, not part of this sprint (see prisma/schema.prisma's comment on the Student model).
export interface StudentEntity {
  id: string;
  tenantId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: GenderValue | null;
  photoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  admissionDate: Date;
  status: StudentStatusValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

// Read-model projection for the Student List (Sprint 4 — Step 5) — a StudentEntity enriched
// with the fields the list view needs from *other* aggregates (current Enrollment, primary
// Guardian), so the list page doesn't do its own N+1 lookups per row. Still a domain entity
// (decoupled from Prisma, mapped in the infrastructure layer), just a wider one than the plain
// StudentEntity other callers (e.g. admit-student.service.ts) use. "Current" enrollment = the
// row with `endDate IS NULL`, matching EnrollmentRepository.findCurrentForStudent's definition.
export interface StudentListItemEntity extends StudentEntity {
  currentAcademicSessionName: string | null;
  currentClassName: string | null;
  currentSectionName: string | null;
  currentRollNumber: string | null;
  primaryGuardianName: string | null;
  primaryGuardianPhone: string | null;
}

// Read-model projections for the Student Profile page (Sprint 4 — Step 6).
export interface StudentProfileGuardianEntity {
  id: string;
  relationship: GuardianRelationshipValue;
  isPrimary: boolean;
  fullName: string;
  occupation: string | null;
  phone: string | null;
}

export interface StudentProfileEnrollmentEntity {
  id: string;
  academicSessionName: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  startDate: Date;
  endDate: Date | null;
  status: EnrollmentStatusValue;
}

// A StudentEntity enriched with EVERY guardian (not just primary) and EVERY enrollment (not
// just current) — the profile page needs the full picture, unlike the List page's
// StudentListItemEntity which only needs one of each. `deletedAt` is deliberately still present
// (inherited from StudentEntity) — the repository stays a pure data reader (per
// docs/CODING_STANDARDS.md §6: repositories contain no business rules); it's
// get-student-profile.service.ts's job to decide that a soft-deleted row means "not found."
export interface StudentProfileEntity extends StudentEntity {
  guardians: StudentProfileGuardianEntity[];
  enrollments: StudentProfileEnrollmentEntity[];
}
