import "server-only";
import { PrismaVehicleAssignmentRepository } from "../infrastructure/prisma-vehicle-assignment.repository";
import { toVehicleAssignmentDTO } from "./assign-vehicle-to-route.service";
import type { VehicleAssignmentDTO } from "./dto/vehicle-assignment.dto";

export async function listVehicleAssignments(
  context: { tenantId: string },
  academicSessionId: string
): Promise<VehicleAssignmentDTO[]> {
  const repository = new PrismaVehicleAssignmentRepository();
  const assignments = await repository.findByAcademicSession(context.tenantId, academicSessionId);
  return assignments.map(toVehicleAssignmentDTO);
}

export async function getVehicleAssignmentForRoute(
  context: { tenantId: string },
  routeId: string,
  academicSessionId: string
): Promise<VehicleAssignmentDTO | null> {
  const repository = new PrismaVehicleAssignmentRepository();
  const assignment = await repository.findByRoute(context.tenantId, routeId, academicSessionId);
  return assignment ? toVehicleAssignmentDTO(assignment) : null;
}
