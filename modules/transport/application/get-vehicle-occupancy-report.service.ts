import "server-only";
import { PrismaVehicleAssignmentRepository } from "../infrastructure/prisma-vehicle-assignment.repository";
import { PrismaVehicleRepository } from "../infrastructure/prisma-vehicle.repository";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { PrismaStudentTransportAssignmentRepository } from "../infrastructure/prisma-student-transport-assignment.repository";
import type { VehicleOccupancyReportDTO, VehicleOccupancyRowDTO } from "./dto/reports.dto";

// Vehicle occupancy vs. capacity (Phase 10 requirement 12/9 — "occupancy calculations").
export async function getVehicleOccupancyReport(
  tenantId: string,
  academicSessionId: string
): Promise<VehicleOccupancyReportDTO> {
  const assignmentRepository = new PrismaVehicleAssignmentRepository();
  const assignments = await assignmentRepository.findByAcademicSession(tenantId, academicSessionId);

  const vehicleRepository = new PrismaVehicleRepository();
  const routeRepository = new PrismaRouteRepository();
  const studentAssignmentRepository = new PrismaStudentTransportAssignmentRepository();

  const rows: VehicleOccupancyRowDTO[] = [];
  for (const assignment of assignments) {
    const vehicle = await vehicleRepository.findById(tenantId, assignment.vehicleId);
    const route = await routeRepository.findById(tenantId, assignment.routeId);
    if (!vehicle || !route) continue;

    const studentAssignments = await studentAssignmentRepository.findByRoute(tenantId, assignment.routeId, academicSessionId, {
      status: "ACTIVE",
    });
    const assignedStudentCount = studentAssignments.length;
    const occupancyPercent =
      vehicle.seatingCapacity > 0 ? Math.round((assignedStudentCount / vehicle.seatingCapacity) * 1000) / 10 : 0;

    rows.push({
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      seatingCapacity: vehicle.seatingCapacity,
      routeId: route.id,
      routeName: route.name,
      assignedStudentCount,
      occupancyPercent,
    });
  }

  rows.sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber));

  return { academicSessionId, rows };
}
