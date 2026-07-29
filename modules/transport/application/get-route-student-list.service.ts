import "server-only";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import { PrismaRouteStopRepository } from "../infrastructure/prisma-route-stop.repository";
import type { RouteStudentListDTO, RouteStudentListRowDTO } from "./dto/reports.dto";

// Route-wise Student List (Phase 10 requirement 12).
export async function getRouteStudentList(
  tenantId: string,
  routeId: string,
  academicSessionId: string
): Promise<RouteStudentListDTO> {
  const assignmentRepository = new PrismaStudentTransportAssignmentRepository();
  const assignments = await assignmentRepository.findByRoute(tenantId, routeId, academicSessionId);

  const stopRepository = new PrismaRouteStopRepository();
  const stops = await stopRepository.findByRoute(tenantId, routeId);
  const stopNameById = new Map(stops.map((stop) => [stop.id, stop.name]));

  const studentRepository = new PrismaStudentRepository();
  const rows: RouteStudentListRowDTO[] = [];
  for (const assignment of assignments) {
    const student = await studentRepository.findById(tenantId, assignment.studentId);
    if (!student) continue;
    rows.push({
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      fullName: `${student.firstName} ${student.lastName}`,
      stopId: assignment.stopId,
      stopName: stopNameById.get(assignment.stopId) ?? "Unknown",
      tripType: assignment.tripType,
      status: assignment.status,
    });
  }

  rows.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return { routeId, academicSessionId, rows };
}
