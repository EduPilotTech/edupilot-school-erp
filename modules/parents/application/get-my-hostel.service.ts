import "server-only";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getCurrentStudentHostelAssignment } from "@/modules/hostel/application/get-student-hostel-assignment.service";
import { PrismaHostelRoomRepository } from "@/modules/hostel/infrastructure/prisma-hostel-room.repository";
import { PrismaHostelFloorRepository } from "@/modules/hostel/infrastructure/prisma-hostel-floor.repository";
import { PrismaHostelBuildingRepository } from "@/modules/hostel/infrastructure/prisma-hostel-building.repository";
import { PrismaHostelRepository } from "@/modules/hostel/infrastructure/prisma-hostel.repository";
import { PrismaHostelBedRepository } from "@/modules/hostel/infrastructure/prisma-hostel-bed.repository";
import { getStudentHostelAttendanceHistory } from "@/modules/hostel/application/get-hostel-attendance.service";
import { listHostelLeaveRequestsByStudent } from "@/modules/hostel/application/list-hostel-leave-requests.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { MyHostelDTO } from "./dto/my-hostel.dto";

export interface GetMyHostelContext {
  tenantId: string;
  userProfileId: string;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Parent Portal Integration (Phase 11 requirement: "Parents can view Room, Bed, Attendance,
// Leave") — composes the student's hostel room/bed assignment, today's morning/night attendance,
// and pending/upcoming leave, reusing the existing guardian-access authorization gate exactly
// like every other parent-facing read service in this module. Hostel Notices reuse the existing
// Notice Board (Phase 9) directly, already reachable at /parent/notices — no separate feed built
// here. Returns null when the student has no active hostel assignment (most students may not
// live in the hostel).
export async function getMyHostel(studentId: string, context: GetMyHostelContext): Promise<MyHostelDTO | null> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return null;

  const assignment = await getCurrentStudentHostelAssignment(context.tenantId, studentId, currentSession.id);
  if (!assignment || assignment.status === "CHECKED_OUT") return null;

  const roomRepository = new PrismaHostelRoomRepository();
  const bedRepository = new PrismaHostelBedRepository();
  const floorRepository = new PrismaHostelFloorRepository();
  const buildingRepository = new PrismaHostelBuildingRepository();
  const hostelRepository = new PrismaHostelRepository();

  const [room, bed] = await Promise.all([
    roomRepository.findById(context.tenantId, assignment.roomId),
    bedRepository.findById(context.tenantId, assignment.bedId),
  ]);
  const floor = room ? await floorRepository.findById(context.tenantId, room.floorId) : null;
  const building = floor ? await buildingRepository.findById(context.tenantId, floor.buildingId) : null;
  const hostel = building ? await hostelRepository.findById(context.tenantId, building.hostelId) : null;

  const today = startOfToday();
  const attendanceToday = await getStudentHostelAttendanceHistory(
    { tenantId: context.tenantId },
    studentId,
    today,
    today
  );
  const todayMorningStatus = attendanceToday.find((row) => row.session === "MORNING")?.status ?? null;
  const todayNightStatus = attendanceToday.find((row) => row.session === "NIGHT")?.status ?? null;

  const leaveRequests = await listHostelLeaveRequestsByStudent(context.tenantId, studentId);
  const pendingLeaveCount = leaveRequests.filter((leave) => leave.status === "PENDING").length;
  const upcomingApproved = leaveRequests
    .filter((leave) => leave.status === "APPROVED" && leave.toDate >= today.toISOString().slice(0, 10))
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate))[0];

  return {
    hostelName: hostel?.name ?? "Unknown",
    buildingName: building?.name ?? "Unknown",
    roomNumber: room?.roomNumber ?? "Unknown",
    bedNumber: bed?.bedNumber ?? "Unknown",
    dietPreference: assignment.dietPreference,
    checkInDate: assignment.checkInDate,
    status: assignment.status,
    todayMorningStatus,
    todayNightStatus,
    pendingLeaveCount,
    upcomingApprovedLeave: upcomingApproved
      ? { fromDate: upcomingApproved.fromDate, toDate: upcomingApproved.toDate, leaveType: upcomingApproved.leaveType }
      : null,
  };
}
