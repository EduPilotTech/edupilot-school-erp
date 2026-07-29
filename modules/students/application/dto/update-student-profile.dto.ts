import { z } from "zod";

// Sprint 4 — Step 7. Deliberately narrower than admission-form.schema.ts: no Academic fields
// (Class/Section/Session/Roll Number) — EnrollmentRepository has no `update` method by design
// (see modules/students/domain/enrollment.repository.ts's own comment), and the user confirmed
// academic placement stays out of scope for this edit form; changing it belongs to a future
// Transfer/Promotion feature that properly closes the old Enrollment and opens a new one. No
// `admissionNumber` field either — immutable once assigned, matching UpdateStudentInput's own
// shape (modules/students/domain/student.repository.ts), which has never included it.
const guardianSlotSchema = z.object({
  fullName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
});

export const updateStudentProfileSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),

  student: z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  }),

  // Single free-text `address` line, matching Student's one Prisma `address` column — same
  // reasoning as admit-student.dto.ts.
  address: z.object({
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
  }),

  // Three fixed slots, matching admission's own guardian structure — not a freeform list. No
  // guardian id is submitted by the client: the service resolves "does a FATHER/MOTHER/local
  // Guardian StudentGuardian already exist for this student?" itself from the freshly-fetched,
  // tenant-scoped profile, rather than trusting a client-submitted id as proof of ownership.
  guardians: z.object({
    father: guardianSlotSchema,
    mother: guardianSlotSchema,
    localGuardian: guardianSlotSchema,
  }),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

export interface UpdateStudentProfileResult {
  studentId: string;
}
