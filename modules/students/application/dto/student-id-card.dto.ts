import { z } from "zod";
import type { GenderValue } from "../../domain/student.entity";

export const getStudentIdCardSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),
});
export type GetStudentIdCardInput = z.infer<typeof getStudentIdCardSchema>;

// School branding data the ID card needs — passed in by the caller (a Server Component/Action)
// rather than fetched by this service itself. `getCurrentSchool()` (lib/auth/auth-context.ts)
// resolves the ACTING user's own tenant from their live session — an application service
// shouldn't reach into `lib/auth` to re-derive "who is asking" itself; every other service in
// this codebase receives that as an explicit `context` param instead (see
// admit-student.service.ts's `{ tenantId, actingUserId }`), and this follows the same rule.
export interface StudentIdCardSchoolInfo {
  name: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  email: string;
}

// Sprint 4.9. Composes data already available from existing services/repositories — no new
// repository methods, no schema changes. `qrValue` is the student's raw UUID (`student.id`),
// per this sprint's literal "Generate unique QR from Student UUID" requirement; it is not a
// verification URL — no public "scan to view profile" endpoint exists yet (a future feature).
export interface StudentIdCardDTO {
  student: {
    id: string;
    admissionNumber: string;
    fullName: string;
    dateOfBirth: Date;
    gender: GenderValue | null;
  };
  // null when the student has no current enrollment — same "no crash, empty state" handling as
  // get-student-profile.service.ts's `academic` field.
  academic: {
    academicSessionName: string;
    className: string;
    sectionName: string;
    rollNumber: string | null;
  } | null;
  // Signed URL from the student's PHOTO document (Sprint 4.8), or null if none has been
  // uploaded — the ID card front falls back to a placeholder/initials in that case.
  photoUrl: string | null;
  qrValue: string;
  school: StudentIdCardSchoolInfo;
}
