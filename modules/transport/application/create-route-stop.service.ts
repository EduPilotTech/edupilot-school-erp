import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { PrismaRouteStopRepository } from "../infrastructure/prisma-route-stop.repository";
import { RouteNotFoundError } from "../domain/errors";
import { createRouteStopSchema, type RouteStopDTO } from "./dto/route.dto";
import type { RouteStopEntity } from "../domain/route-stop.entity";
import type { TransportContext } from "./create-vehicle.service";

function toDTO(entity: RouteStopEntity): RouteStopDTO {
  return {
    id: entity.id,
    routeId: entity.routeId,
    name: entity.name,
    sequenceOrder: entity.sequenceOrder,
    pickupTime: entity.pickupTime,
    dropTime: entity.dropTime,
    landmark: entity.landmark,
    latitude: entity.latitude,
    longitude: entity.longitude,
    isActive: entity.isActive,
  };
}

export async function createRouteStop(input: unknown, context: TransportContext): Promise<RouteStopDTO> {
  const parsed = createRouteStopSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid route stop data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const routeRepository = new PrismaRouteRepository();
  const route = await routeRepository.findById(tenantId, data.routeId);
  if (!route || route.deletedAt !== null) {
    throw new RouteNotFoundError();
  }

  const repository = new PrismaRouteStopRepository();
  const stop = await repository.create({
    tenantId,
    routeId: data.routeId,
    name: data.name,
    sequenceOrder: data.sequenceOrder,
    pickupTime: data.pickupTime ?? null,
    dropTime: data.dropTime ?? null,
    landmark: data.landmark ?? null,
    createdBy: actingUserId,
  });
  return toDTO(stop);
}

export { toDTO as toRouteStopDTO };
