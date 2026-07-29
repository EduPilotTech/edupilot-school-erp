import "server-only";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { PrismaStudentTransportAssignmentRepository } from "@/modules/transport/infrastructure/prisma-student-transport-assignment.repository";
import { PrismaRouteRepository } from "@/modules/transport/infrastructure/prisma-route.repository";
import { PrismaRouteStopRepository } from "@/modules/transport/infrastructure/prisma-route-stop.repository";
import { PrismaVehicleAssignmentRepository } from "@/modules/transport/infrastructure/prisma-vehicle-assignment.repository";
import { PrismaVehicleRepository } from "@/modules/transport/infrastructure/prisma-vehicle.repository";
import { PrismaDriverRepository } from "@/modules/transport/infrastructure/prisma-driver.repository";
import { PrismaHelperRepository } from "@/modules/transport/infrastructure/prisma-helper.repository";
import { PrismaTransportAttendanceRepository } from "@/modules/transport/infrastructure/prisma-transport-attendance.repository";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { MyTransportDTO } from "./dto/my-transport.dto";

export interface GetMyTransportContext {
  tenantId: string;
  userProfileId: string;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Parent Portal Integration (Phase 10 Decision 10) — composes the student's route/stop/vehicle/
// driver assignment plus today's boarding status, reusing the existing guardian-access
// authorization gate exactly like every other parent-facing read service in this module. Returns
// null when the student has no active transport assignment (most students may not use transport
// at all).
export async function getMyTransport(studentId: string, context: GetMyTransportContext): Promise<MyTransportDTO | null> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return null;

  const assignmentRepository = new PrismaStudentTransportAssignmentRepository();
  const assignment = await assignmentRepository.findByStudent(context.tenantId, studentId, currentSession.id);
  if (!assignment || assignment.status === "DISCONTINUED") return null;

  const routeRepository = new PrismaRouteRepository();
  const stopRepository = new PrismaRouteStopRepository();
  const [route, stop] = await Promise.all([
    routeRepository.findById(context.tenantId, assignment.routeId),
    stopRepository.findById(context.tenantId, assignment.stopId),
  ]);

  const vehicleAssignmentRepository = new PrismaVehicleAssignmentRepository();
  const vehicleAssignment = await vehicleAssignmentRepository.findByRoute(
    context.tenantId,
    assignment.routeId,
    currentSession.id
  );

  let vehicleRegistrationNumber: string | null = null;
  let driverName: string | null = null;
  let driverPhone: string | null = null;
  let helperName: string | null = null;

  if (vehicleAssignment && vehicleAssignment.isActive) {
    const vehicleRepository = new PrismaVehicleRepository();
    const driverRepository = new PrismaDriverRepository();
    const vehicle = await vehicleRepository.findById(context.tenantId, vehicleAssignment.vehicleId);
    const driver = await driverRepository.findById(context.tenantId, vehicleAssignment.driverId);
    vehicleRegistrationNumber = vehicle?.registrationNumber ?? null;
    driverName = driver?.fullName ?? null;
    driverPhone = driver?.phone ?? null;

    if (vehicleAssignment.helperId) {
      const helperRepository = new PrismaHelperRepository();
      const helper = await helperRepository.findById(context.tenantId, vehicleAssignment.helperId);
      helperName = helper?.fullName ?? null;
    }
  }

  const attendanceRepository = new PrismaTransportAttendanceRepository();
  const today = startOfToday();
  const [pickupAttendance, dropAttendance] = await Promise.all([
    attendanceRepository.findByRouteAndDate(context.tenantId, assignment.routeId, today, "PICKUP"),
    attendanceRepository.findByRouteAndDate(context.tenantId, assignment.routeId, today, "DROP"),
  ]);
  const todayPickupStatus = pickupAttendance.find((row) => row.studentId === studentId)?.status ?? null;
  const todayDropStatus = dropAttendance.find((row) => row.studentId === studentId)?.status ?? null;

  return {
    routeName: route?.name ?? "Unknown",
    stopName: stop?.name ?? "Unknown",
    pickupTime: stop?.pickupTime ?? null,
    dropTime: stop?.dropTime ?? null,
    tripType: assignment.tripType,
    status: assignment.status,
    vehicleRegistrationNumber,
    driverName,
    driverPhone,
    helperName,
    todayPickupStatus,
    todayDropStatus,
  };
}
