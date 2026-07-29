import "server-only";
import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import { getStudentAttendanceReport } from "@/modules/attendance/application/get-student-attendance-report.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { StudentAttendanceReportDTO } from "@/modules/attendance/application/dto/attendance-report.dto";

export interface GetMyAttendanceContext {
  tenantId: string;
  userProfileId: string;
}

const studentIdSchema = z.object({ studentId: z.string().uuid("Invalid student id.") });

// Attendance View (requirement 6) — reuses get-student-attendance-report.service.ts (Phase 5)
// directly.
export async function getMyAttendance(
  input: unknown,
  context: GetMyAttendanceContext
): Promise<StudentAttendanceReportDTO> {
  const parsed = studentIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid student id.");
  }

  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, parsed.data.studentId);

  return getStudentAttendanceReport(input, { tenantId: context.tenantId });
}
