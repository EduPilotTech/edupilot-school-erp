import "server-only";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import { PrismaTeacherAttendanceRepository } from "../infrastructure/prisma-teacher-attendance.repository";
import { InvalidAttendanceDateError } from "../domain/errors";
import { markTeacherAttendanceSchema, type TeacherAttendanceDTO } from "./dto/attendance.dto";

export interface MarkTeacherAttendanceContext {
  tenantId: string;
  actingUserId: string;
}

// Staff attendance — references UserProfile directly (see modules/attendance/domain/
// teacher-attendance.repository.ts's comment on why no Teacher module exists). No academic
// session/class/section scope needed here, unlike student attendance — a staff member's
// attendance isn't tied to a class. "Session-aware" for staff attendance is therefore just
// "not a future date," the one date-validity rule that still applies.
export async function markTeacherAttendance(
  input: unknown,
  context: MarkTeacherAttendanceContext
): Promise<TeacherAttendanceDTO> {
  const parsed = markTeacherAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid attendance data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  if (data.date.getTime() > Date.now()) {
    throw new InvalidAttendanceDateError();
  }

  const userProfileRepository = new PrismaUserProfileRepository();
  const userProfile = await userProfileRepository.findById(tenantId, data.userProfileId);
  if (!userProfile || userProfile.deletedAt !== null) {
    throw new NotFoundError("Staff member not found.");
  }

  const attendanceRepository = new PrismaTeacherAttendanceRepository();
  const attendance = await attendanceRepository.markOne({
    tenantId,
    userProfileId: userProfile.id,
    date: data.date,
    status: data.status,
    remarks: data.remarks ?? null,
    markedBy: actingUserId,
  });

  return {
    id: attendance.id,
    userProfileId: attendance.userProfileId,
    date: attendance.date,
    status: attendance.status,
    remarks: attendance.remarks,
    markedBy: attendance.markedBy,
  };
}
