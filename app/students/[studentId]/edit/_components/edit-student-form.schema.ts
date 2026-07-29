import { z } from "zod";

// Client-facing form schema — deliberately a different (but structurally compatible) shape from
// modules/students/application/dto/update-student-profile.dto.ts's `updateStudentProfileSchema`,
// the same split admission-form.schema.ts uses against admit-student.dto.ts: `dateOfBirth` here
// is a string (an `<input type="date">` can only hold a string value), coerced to a real `Date`
// server-side by the DTO schema's `z.coerce.date()` — Zod's `.safeParse()` accepts `unknown`
// regardless of the DTO's inferred type, so no manual reshape function is needed, unlike
// admission's form (which also had to strip several UI-only fields with no backing column; this
// edit form doesn't collect any, since Requirement 2 already scopes it to backed fields only).
const guardianSlotSchema = z.object({
  fullName: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  occupation: z.string().trim().optional().or(z.literal("")),
});

export const editStudentFormSchema = z.object({
  studentId: z.string().uuid(),

  student: z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select a gender." }),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required.")
      .refine((value) => new Date(value) <= new Date(), "Date of birth cannot be in the future."),
  }),

  address: z.object({
    address: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().optional().or(z.literal("")),
    state: z.string().trim().optional().or(z.literal("")),
    country: z.string().trim().optional().or(z.literal("")),
    postalCode: z.string().trim().optional().or(z.literal("")),
  }),

  guardians: z.object({
    father: guardianSlotSchema,
    mother: guardianSlotSchema,
    localGuardian: guardianSlotSchema,
  }),
});

export type EditStudentFormValues = z.infer<typeof editStudentFormSchema>;
