import { z } from "zod";
import type { GenderValue, StudentStatusValue } from "../../domain/student.entity";
import type { GuardianRelationshipValue } from "../../domain/student-guardian.repository";
import type { EnrollmentStatusValue } from "../../domain/enrollment.entity";

// `studentId` arrives as a URL path segment (app/students/[studentId]/page.tsx) — a user can
// type anything there, so it's validated the same way any other external input is
// (docs/CODING_STANDARDS.md §4), not trusted as already a well-formed id.
export const getStudentProfileSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),
});

export type GetStudentProfileInput = z.infer<typeof getStudentProfileSchema>;

// Sprint 4 — Step 6. The application-layer shape returned to the page — a step beyond
// StudentProfileEntity (the repository's plain data projection): here the service has computed
// derived fields (age, fullName), picked out the current enrollment for the Academic Information
// section, and attached explicit `available` flags for the sections this sprint has no backing
// data for (Medical, Documents, full Activity history) so the UI can render a real "not
// implemented yet" empty state instead of confusing an unbacked section with a backed-but-empty
// one.
export interface StudentProfileDTO {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    fullName: string;
    gender: GenderValue | null;
    dateOfBirth: Date;
    age: number;
    photoUrl: string | null;
    status: StudentStatusValue;
  };

  // null when the student has no current enrollment (endDate IS NULL) row at all — shouldn't
  // normally happen post-admission, but the UI renders an empty state rather than crashing if it
  // does (e.g. a future "close enrollment without re-enrolling" action leaves this null).
  academic: {
    academicSessionName: string;
    className: string;
    sectionName: string;
    rollNumber: string | null;
    admissionDate: Date;
  } | null;

  guardians: Array<{
    id: string;
    relationship: GuardianRelationshipValue;
    isPrimary: boolean;
    fullName: string;
    occupation: string | null;
    phone: string | null;
  }>;

  address: {
    current: {
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      postalCode: string | null;
    };
    // Always false this step — Student has exactly one `address` column, no separate
    // "permanent address" (established in Sprint 4 — Step 4's report). Not a bug; there is
    // nothing to fetch.
    permanentAvailable: false;
  };

  medical: { available: false; items: never[] };
  documents: { available: false; items: never[] };

  enrollmentHistory: Array<{
    id: string;
    academicSessionName: string;
    className: string;
    sectionName: string;
    rollNumber: string | null;
    startDate: Date;
    endDate: Date | null;
    status: EnrollmentStatusValue;
    isCurrent: boolean;
  }>;

  activityTimeline: {
    // false — there's no AuditLog/status-history table yet (see modules/users' own
    // TODO(audit) comments). The `events` below are real data (Student.createdAt/updatedAt),
    // not fabricated placeholders — `available: false` signals that this is a partial picture,
    // not that the whole section is empty.
    available: false;
    events: Array<{ label: string; timestamp: Date }>;
  };
}
