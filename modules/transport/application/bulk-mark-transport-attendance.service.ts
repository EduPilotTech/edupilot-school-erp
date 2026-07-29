import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentGuardianRepository } from "@/modules/students/infrastructure/prisma-student-guardian.repository";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { dispatchNotification } from "@/modules/communication/application/dispatch-notification.helpers";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { PrismaVehicleAssignmentRepository } from "../infrastructure/prisma-vehicle-assignment.repository";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import { PrismaTransportAttendanceRepository } from "../infrastructure/prisma-transport-attendance.repository";
import {
  RouteNotFoundError,
  StudentTransportAssignmentNotFoundError,
  VehicleAssignmentNotFoundError,
} from "../domain/errors";
import { bulkMarkTransportAttendanceSchema, type TransportAttendanceDTO } from "./dto/transport-attendance.dto";

const TRIP_LEG_LABEL: Record<string, string> = { PICKUP: "pickup", DROP: "drop" };

// Decision 10 — reuses the existing notification infrastructure (dispatchNotification) exactly
// as publish-notice.service.ts does: resolve every guardian linked to this student with portal
// access, notify each. Only ABSENT/LATE trigger a notification — BOARDED is the expected case
// and would just be noise.
async function notifyGuardiansOfAttendance(
  tenantId: string,
  studentId: string,
  routeName: string,
  tripLeg: string,
  status: "ABSENT" | "LATE",
  tx: Prisma.TransactionClient
): Promise<void> {
  const studentGuardianRepository = new PrismaStudentGuardianRepository();
  const guardianRepository = new PrismaGuardianRepository();
  const links = await studentGuardianRepository.listForStudent(tenantId, studentId);

  const leg = TRIP_LEG_LABEL[tripLeg] ?? tripLeg.toLowerCase();
  const title = status === "ABSENT" ? "Transport: student not boarded" : "Transport: running late";
  const body =
    status === "ABSENT"
      ? `Your child was not boarded on the ${leg} trip today (route ${routeName}).`
      : `Your child's ${leg} trip today is running late (route ${routeName}).`;

  for (const link of links) {
    const guardian = await guardianRepository.findById(tenantId, link.guardianId);
    if (!guardian?.userProfileId) continue;
    await dispatchNotification(
      {
        tenantId,
        recipientUserProfileId: guardian.userProfileId,
        type: "TRANSPORT_ALERT",
        priority: "HIGH",
        title,
        body,
        referenceType: "TransportAttendance",
        referenceId: studentId,
      },
      tx
    );
  }
}

export interface BulkMarkTransportAttendanceContext {
  tenantId: string;
  actingUserId: string;
}

// Bulk Mark Transport Attendance: one route/date/tripLeg, many students, marked atomically —
// mirrors bulkMarkStudentAttendance.service.ts's own shape. routeId/stopId/vehicleId are resolved
// once per student from that student's StudentTransportAssignment plus the route's
// VehicleAssignment, then denormalized onto each TransportAttendance row (see
// TransportAttendanceEntity's own doc comment for why).
export async function bulkMarkTransportAttendance(
  input: unknown,
  context: BulkMarkTransportAttendanceContext
): Promise<TransportAttendanceDTO[]> {
  const parsed = bulkMarkTransportAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid transport attendance data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const routeRepository = new PrismaRouteRepository();
  const route = await routeRepository.findById(tenantId, data.routeId);
  if (!route || route.deletedAt !== null) {
    throw new RouteNotFoundError();
  }

  const vehicleAssignmentRepository = new PrismaVehicleAssignmentRepository();
  const vehicleAssignment = await vehicleAssignmentRepository.findByRoute(tenantId, data.routeId, data.academicSessionId);
  if (!vehicleAssignment || !vehicleAssignment.isActive) {
    throw new VehicleAssignmentNotFoundError();
  }

  const studentAssignmentRepository = new PrismaStudentTransportAssignmentRepository();
  const studentAssignments = await studentAssignmentRepository.findByRoute(tenantId, data.routeId, data.academicSessionId);
  const assignmentByStudentId = new Map(studentAssignments.map((assignment) => [assignment.studentId, assignment]));

  const attendanceRepository = new PrismaTransportAttendanceRepository();

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const results: TransportAttendanceDTO[] = [];
      for (const entry of data.entries) {
        const assignment = assignmentByStudentId.get(entry.studentId);
        if (!assignment) {
          throw new StudentTransportAssignmentNotFoundError();
        }

        const attendance = await attendanceRepository.markOne(
          {
            tenantId,
            studentId: entry.studentId,
            studentTransportAssignmentId: assignment.id,
            routeId: data.routeId,
            stopId: assignment.stopId,
            vehicleId: vehicleAssignment.vehicleId,
            date: data.date,
            tripLeg: data.tripLeg,
            status: entry.status,
            remarks: entry.remarks ?? null,
            markedBy: actingUserId,
          },
          tx
        );

        if (attendance.status === "ABSENT" || attendance.status === "LATE") {
          await notifyGuardiansOfAttendance(tenantId, entry.studentId, route.name, data.tripLeg, attendance.status, tx);
        }

        results.push({
          id: attendance.id,
          studentId: attendance.studentId,
          studentTransportAssignmentId: attendance.studentTransportAssignmentId,
          routeId: attendance.routeId,
          stopId: attendance.stopId,
          vehicleId: attendance.vehicleId,
          date: attendance.date,
          tripLeg: attendance.tripLeg,
          status: attendance.status,
          remarks: attendance.remarks,
          markedBy: attendance.markedBy,
        });
      }
      return results;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new StudentNotFoundError();
    }
    throw error;
  }
}
