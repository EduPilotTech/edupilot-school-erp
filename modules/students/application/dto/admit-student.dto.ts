import { z } from "zod";

// Defense-in-depth re-validation for admit-student.service.ts, per docs/CODING_STANDARDS.md §4:
// the Server Action already validates the full form against the existing `admissionFormSchema`
// (components/features/students/admission-form.schema.ts); this schema re-validates only the
// narrower, Prisma-column-backed subset the service actually persists — deliberately does not
// re-declare fields with no backing Student/Guardian column (middleName, student mobile/email,
// permanent address, transport/hostel/medical/uploads/declaration — see the Sprint 4 — Step 4
// final report for the full list of what this step does not persist).
const guardianInputSchema = z.object({
  fullName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
});

export const admitStudentSchema = z.object({
  student: z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  }),

  academic: z.object({
    academicSessionId: z.string().min(1, "Academic session is required."),
    classId: z.string().min(1, "Class is required."),
    sectionId: z.string().min(1, "Section is required."),
    rollNumber: z.string().trim().optional(),
    admissionDate: z.coerce.date(),
  }),

  // Single free-text `address` line, matching Student's one Prisma `address` column — the UI's
  // separate "line1"/"line2" are joined into one string by the Server Action's mapping function
  // before this schema ever sees them (reshaping, not business logic).
  address: z.object({
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
  }),

  guardians: z.object({
    father: guardianInputSchema,
    mother: guardianInputSchema,
    // The UI's "local guardian" also collects a free-text `relation` field, which has no
    // backing column on Guardian (only `occupation` exists) — dropped here, same treatment as
    // every other unbacked field.
    localGuardian: guardianInputSchema,
  }),

  createdBy: z.string().min(1),
});

export type AdmitStudentInput = z.infer<typeof admitStudentSchema>;

export interface AdmitStudentResult {
  studentId: string;
  admissionNumber: string;
  enrollmentId: string;
}
