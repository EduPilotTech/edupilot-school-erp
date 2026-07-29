import "server-only";
import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import { getStudentProfile } from "@/modules/students/application/get-student-profile.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

export interface GetMyStudentProfileContext {
  tenantId: string;
  userProfileId: string;
}

const studentIdSchema = z.object({ studentId: z.string().uuid("Invalid student id.") });

// Student Profile View (requirement 5) — reuses get-student-profile.service.ts (Phase 4)
// directly, gated by "is this student one of my linked children" (assertGuardianCanAccessStudent)
// rather than a duplicated read implementation.
export async function getMyStudentProfile(
  input: unknown,
  context: GetMyStudentProfileContext
): Promise<StudentProfileDTO> {
  const parsed = studentIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid student id.");
  }

  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, parsed.data.studentId);

  return getStudentProfile(input, { tenantId: context.tenantId });
}
