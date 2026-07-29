import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { PrismaVehicleRepository } from "../infrastructure/prisma-vehicle.repository";
import { PrismaDriverRepository } from "../infrastructure/prisma-driver.repository";
import { PrismaHelperRepository } from "../infrastructure/prisma-helper.repository";
import { PrismaVehicleAssignmentRepository } from "../infrastructure/prisma-vehicle-assignment.repository";
import {
  DriverNotFoundError,
  HelperNotFoundError,
  RouteNotFoundError,
  VehicleAlreadyAssignedError,
  VehicleNotFoundError,
} from "../domain/errors";
import { assignVehicleToRouteSchema, type VehicleAssignmentDTO } from "./dto/vehicle-assignment.dto";
import type { VehicleAssignmentEntity } from "../domain/vehicle-assignment.entity";
import type { TransportContext } from "./create-vehicle.service";

function toDTO(entity: VehicleAssignmentEntity): VehicleAssignmentDTO {
  return {
    id: entity.id,
    routeId: entity.routeId,
    academicSessionId: entity.academicSessionId,
    vehicleId: entity.vehicleId,
    driverId: entity.driverId,
    helperId: entity.helperId,
    isActive: entity.isActive,
  };
}

// Decision 2 — a 1:1 Route<->Vehicle<->Driver(+Helper) mapping per session. Reassigning updates
// the same VehicleAssignment row (see upsertForRoute); this service's own job is validating the
// route/vehicle/driver/helper all exist and that the vehicle isn't already serving a different
// route this session.
export async function assignVehicleToRoute(
  input: unknown,
  context: TransportContext
): Promise<VehicleAssignmentDTO> {
  const parsed = assignVehicleToRouteSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid vehicle assignment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const routeRepository = new PrismaRouteRepository();
  const route = await routeRepository.findById(tenantId, data.routeId);
  if (!route || route.deletedAt !== null) {
    throw new RouteNotFoundError();
  }

  const vehicleRepository = new PrismaVehicleRepository();
  const vehicle = await vehicleRepository.findById(tenantId, data.vehicleId);
  if (!vehicle || vehicle.deletedAt !== null) {
    throw new VehicleNotFoundError();
  }

  const driverRepository = new PrismaDriverRepository();
  const driver = await driverRepository.findById(tenantId, data.driverId);
  if (!driver || driver.deletedAt !== null) {
    throw new DriverNotFoundError();
  }

  if (data.helperId) {
    const helperRepository = new PrismaHelperRepository();
    const helper = await helperRepository.findById(tenantId, data.helperId);
    if (!helper || helper.deletedAt !== null) {
      throw new HelperNotFoundError();
    }
  }

  const assignmentRepository = new PrismaVehicleAssignmentRepository();
  const existingForVehicle = await assignmentRepository.findByVehicle(tenantId, data.vehicleId, data.academicSessionId);
  if (existingForVehicle && existingForVehicle.isActive && existingForVehicle.routeId !== data.routeId) {
    throw new VehicleAlreadyAssignedError();
  }

  const assignment = await assignmentRepository.upsertForRoute({
    tenantId,
    routeId: data.routeId,
    academicSessionId: data.academicSessionId,
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    helperId: data.helperId ?? null,
    createdBy: actingUserId,
  });
  return toDTO(assignment);
}

export { toDTO as toVehicleAssignmentDTO };
