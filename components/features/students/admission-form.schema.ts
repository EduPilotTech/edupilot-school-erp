import { z } from "zod";

// UI-only validation for the Student Admission form (Sprint 4 — Step 3: "No repository calls,
// no server action, no database" this step). Once a real admit-student Server Action exists
// (modules/students/application), its own DTO (per docs/CODING_STANDARDS.md §4 — Zod schemas
// live next to the service that uses them) should become the source of truth; this schema is a
// deliberately temporary home for client-side validation until that lands.

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — a sensible UI-side cap; real limits belong
// to the future upload implementation, not this form.

const optionalFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, "File must be 5 MB or smaller.")
  .optional();

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number.")
  .optional()
  .or(z.literal(""));

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .optional()
  .or(z.literal(""));

const addressSchema = z.object({
  line1: z.string().trim().min(1, "Address line 1 is required."),
  line2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  country: z.string().trim().min(1, "Country is required."),
  postalCode: z.string().trim().min(1, "Postal code is required."),
});

// Every field optional — a "same as current" address never needs its own required fields, and
// this half of the schema is only meaningfully validated (see the refine below) when the
// "Same as Current Address" checkbox is unchecked.
const partialAddressSchema = z.object({
  line1: z.string().trim().optional().or(z.literal("")),
  line2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
});

const guardianSchema = z.object({
  name: z.string().trim().optional().or(z.literal("")),
  mobile: phoneSchema,
  occupation: z.string().trim().optional().or(z.literal("")),
});

export const admissionFormSchema = z
  .object({
    student: z.object({
      firstName: z.string().trim().min(1, "First name is required."),
      middleName: z.string().trim().optional().or(z.literal("")),
      lastName: z.string().trim().min(1, "Last name is required."),
      gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select a gender." }),
      dateOfBirth: z
        .string()
        .min(1, "Date of birth is required.")
        .refine((value) => new Date(value) <= new Date(), "Date of birth cannot be in the future."),
      aadhaarNumber: z
        .string()
        .trim()
        .regex(/^\d{4}\s?\d{4}\s?\d{4}$/, "Enter a valid 12-digit Aadhaar number.")
        .optional()
        .or(z.literal("")),
      mobile: phoneSchema,
      email: optionalEmailSchema,
    }),

    academic: z.object({
      academicSessionId: z.string().min(1, "Select an academic session."),
      classId: z.string().min(1, "Select a class."),
      sectionId: z.string().min(1, "Select a section."),
      rollNumber: z.string().trim().optional().or(z.literal("")),
      admissionDate: z
        .string()
        .min(1, "Admission date is required.")
        .refine((value) => new Date(value) <= new Date(), "Admission date cannot be in the future."),
    }),

    guardians: z.object({
      father: guardianSchema,
      mother: guardianSchema,
      localGuardian: z.object({
        name: z.string().trim().optional().or(z.literal("")),
        relation: z.string().trim().optional().or(z.literal("")),
        mobile: phoneSchema,
      }),
    }),

    address: z.object({
      current: addressSchema,
      sameAsCurrentAddress: z.boolean(),
      permanent: partialAddressSchema,
    }),

    transport: z.object({
      required: z.boolean(),
      route: z.string().trim().optional().or(z.literal("")),
      pickupPoint: z.string().trim().optional().or(z.literal("")),
    }),

    hostel: z.object({
      required: z.boolean(),
      hostelName: z.string().trim().optional().or(z.literal("")),
      roomNumber: z.string().trim().optional().or(z.literal("")),
    }),

    medical: z.object({
      bloodGroup: z.string().trim().optional().or(z.literal("")),
      allergies: z.string().trim().optional().or(z.literal("")),
      medicalNotes: z.string().trim().optional().or(z.literal("")),
      emergencyContact: phoneSchema,
    }),

    uploads: z.object({
      studentPhoto: optionalFileSchema,
      birthCertificate: optionalFileSchema,
      transferCertificate: optionalFileSchema,
      aadhaarDocument: optionalFileSchema,
      otherDocuments: optionalFileSchema,
    }),

    // A plain `.superRefine()` issue at a top-level (single-segment) path like
    // ["declarationAccepted"] does not surface through @hookform/resolvers' zodResolver, even
    // though nested paths (e.g. ["address", "permanent", "city"]) from the same superRefine
    // work correctly — confirmed by direct testing, not assumed. A field-level `.refine()`
    // (the more idiomatic approach for a single "must be true" rule anyway) does not have this
    // problem, so the rule lives here instead of alongside the other conditional-required
    // checks below.
    declarationAccepted: z
      .boolean()
      .refine((value) => value === true, "You must confirm the declaration before submitting."),
  })
  // Conditional-required fields and cross-field rules live here, not scattered across
  // individual field schemas — every "if X then Y is required" rule in one place.
  .superRefine((values, ctx) => {
    if (!values.address.sameAsCurrentAddress) {
      const { permanent } = values.address;
      if (!permanent.line1?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address", "permanent", "line1"],
          message: "Address line 1 is required.",
        });
      }
      if (!permanent.city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address", "permanent", "city"],
          message: "City is required.",
        });
      }
      if (!permanent.state?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address", "permanent", "state"],
          message: "State is required.",
        });
      }
      if (!permanent.country?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address", "permanent", "country"],
          message: "Country is required.",
        });
      }
      if (!permanent.postalCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address", "permanent", "postalCode"],
          message: "Postal code is required.",
        });
      }
    }

    if (values.transport.required) {
      if (!values.transport.route?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transport", "route"],
          message: "Route is required when transport is requested.",
        });
      }
      if (!values.transport.pickupPoint?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transport", "pickupPoint"],
          message: "Pickup point is required when transport is requested.",
        });
      }
    }

    if (values.hostel.required) {
      if (!values.hostel.hostelName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hostel", "hostelName"],
          message: "Hostel name is required when hostel is requested.",
        });
      }
      if (!values.hostel.roomNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hostel", "roomNumber"],
          message: "Room number is required when hostel is requested.",
        });
      }
    }
  });

export type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

// Save Draft intentionally does not run this schema at all (see AdmissionForm.tsx) — a draft is
// incomplete by definition, so it must never be blocked by required-field/declaration rules
// meant only for final submission.
export const admissionFormDefaultValues: AdmissionFormValues = {
  student: {
    firstName: "",
    middleName: "",
    lastName: "",
    // "" is not a valid Gender at the type level (deliberately — the schema only accepts the
    // three real values, giving a clean "Select a gender." error). Cast here so the <select>
    // renders unselected rather than silently pre-choosing "MALE" on the user's behalf; Zod
    // rejects "" at submit time regardless of this cast.
    gender: "" as unknown as AdmissionFormValues["student"]["gender"],
    dateOfBirth: "",
    aadhaarNumber: "",
    mobile: "",
    email: "",
  },
  academic: {
    academicSessionId: "",
    classId: "",
    sectionId: "",
    rollNumber: "",
    admissionDate: new Date().toISOString().slice(0, 10),
  },
  guardians: {
    father: { name: "", mobile: "", occupation: "" },
    mother: { name: "", mobile: "", occupation: "" },
    localGuardian: { name: "", relation: "", mobile: "" },
  },
  address: {
    current: { line1: "", line2: "", city: "", state: "", country: "", postalCode: "" },
    sameAsCurrentAddress: false,
    permanent: { line1: "", line2: "", city: "", state: "", country: "", postalCode: "" },
  },
  transport: { required: false, route: "", pickupPoint: "" },
  hostel: { required: false, hostelName: "", roomNumber: "" },
  medical: { bloodGroup: "", allergies: "", medicalNotes: "", emergencyContact: "" },
  uploads: {
    studentPhoto: undefined,
    birthCertificate: undefined,
    transferCertificate: undefined,
    aadhaarDocument: undefined,
    otherDocuments: undefined,
  },
  declarationAccepted: false,
};
