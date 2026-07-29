"use server";

// Thin Server Action only — no business logic here, matching app/settings/users/actions.ts.
// Resolves the caller's AuthContext, checks the one permission this action requires, validates
// the full form with the existing `admissionFormSchema` (Sprint 4 — Step 4, Step 4's explicit
// instruction), reshapes the validated subset into admit-student.service's narrower DTO shape,
// delegates to the service, and translates thrown domain errors into a typed ActionResult.
//
// `student.admit` is not yet backed by a real Permission/RolePermission row — no seed data run
// against this permission code yet — matching the same "code exists in code before it's seeded"
// pattern every other module in this codebase follows (see app/settings/users/actions.ts).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { ValidationError } from "@/lib/errors";
import { admitStudent } from "@/modules/students/application/admit-student.service";
import {
  admitStudentSchema,
  type AdmitStudentResult,
} from "@/modules/students/application/dto/admit-student.dto";
import {
  GuardianRequiredError,
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
  StudentAlreadyExistsError,
} from "@/modules/students/domain/errors";
import {
  admissionFormSchema,
  type AdmissionFormValues,
} from "@/components/features/students/admission-form.schema";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Data reshaping only, not business logic (docs/PROJECT_ARCHITECTURE.md: Server Actions are
// thin). Maps the full admission form into the Prisma-column-backed subset the service
// persists. Every field NOT mapped here has no backing Student/Guardian column — see the
// Sprint 4 — Step 4 final report for the complete, explicit list of what this step does not
// persist (middleName, student mobile/email, permanent address, transport/hostel/medical/
// uploads/declaration).
function toAdmitStudentInput(values: AdmissionFormValues, actingUserId: string) {
  const currentAddress = values.address.current;
  const combinedAddress =
    [currentAddress.line1, currentAddress.line2].filter((line) => line?.trim()).join(", ") ||
    undefined;

  return {
    student: {
      firstName: values.student.firstName,
      lastName: values.student.lastName,
      dateOfBirth: values.student.dateOfBirth,
      gender: values.student.gender,
    },
    academic: {
      academicSessionId: values.academic.academicSessionId,
      classId: values.academic.classId,
      sectionId: values.academic.sectionId,
      rollNumber: values.academic.rollNumber || undefined,
      admissionDate: values.academic.admissionDate,
    },
    address: {
      address: combinedAddress,
      city: currentAddress.city || undefined,
      state: currentAddress.state || undefined,
      country: currentAddress.country || undefined,
      postalCode: currentAddress.postalCode || undefined,
    },
    guardians: {
      father: {
        fullName: values.guardians.father.name || undefined,
        phone: values.guardians.father.mobile || undefined,
        occupation: values.guardians.father.occupation || undefined,
      },
      mother: {
        fullName: values.guardians.mother.name || undefined,
        phone: values.guardians.mother.mobile || undefined,
        occupation: values.guardians.mother.occupation || undefined,
      },
      localGuardian: {
        fullName: values.guardians.localGuardian.name || undefined,
        phone: values.guardians.localGuardian.mobile || undefined,
        occupation: undefined,
      },
    },
    createdBy: actingUserId,
  };
}

export async function admitStudentAction(
  values: AdmissionFormValues
): Promise<ActionResult<AdmitStudentResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("student.admit");

  const formResult = admissionFormSchema.safeParse(values);
  if (!formResult.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: formResult.error.issues[0]?.message ?? "The admission form contains invalid data.",
      },
    };
  }

  const mapped = toAdmitStudentInput(formResult.data, authContext.userId);
  const dtoResult = admitStudentSchema.safeParse(mapped);
  if (!dtoResult.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: dtoResult.error.issues[0]?.message ?? "The admission form contains invalid data.",
      },
    };
  }

  try {
    const result = await admitStudent(dtoResult.data, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof InvalidAcademicSessionError) {
      return {
        success: false,
        error: { code: "INVALID_ACADEMIC_SESSION", message: error.message },
      };
    }
    if (error instanceof InvalidClassError) {
      return { success: false, error: { code: "INVALID_CLASS", message: error.message } };
    }
    if (error instanceof InvalidSectionError) {
      return { success: false, error: { code: "INVALID_SECTION", message: error.message } };
    }
    if (error instanceof GuardianRequiredError) {
      return { success: false, error: { code: "GUARDIAN_REQUIRED", message: error.message } };
    }
    if (error instanceof StudentAlreadyExistsError) {
      return {
        success: false,
        error: { code: "STUDENT_ALREADY_EXISTS", message: error.message },
      };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
    }

    // Unexpected — never swallowed silently (docs/CODING_STANDARDS.md §5): let it surface.
    throw error;
  }
}
