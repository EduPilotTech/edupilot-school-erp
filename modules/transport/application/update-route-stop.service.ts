import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteStopRepository } from "../infrastructure/prisma-route-stop.repository";
import { RouteStopNotFoundError } from "../domain/errors";
import { updateRouteStopSchema, type RouteStopDTO } from "./dto/route.dto";
import { toRouteStopDTO } from "./create-route-stop.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateRouteStop(
  stopId: string,
  input: unknown,
  context: TransportContext
): Promise<RouteStopDTO> {
  const parsed = updateRouteStopSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid route stop data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaRouteStopRepository();
  const existing = await repository.findById(tenantId, stopId);
  if (!existing || existing.deletedAt !== null) {
    throw new RouteStopNotFoundError();
  }

  const stop = await repository.update(tenantId, stopId, {
    name: data.name,
    sequenceOrder: data.sequenceOrder,
    pickupTime: data.pickupTime,
    dropTime: data.dropTime,
    landmark: data.landmark,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toRouteStopDTO(stop);
}

export async function deleteRouteStop(stopId: string, context: TransportContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaRouteStopRepository();
  const existing = await repository.findById(tenantId, stopId);
  if (!existing || existing.deletedAt !== null) {
    throw new RouteStopNotFoundError();
  }
  await repository.softDelete(tenantId, stopId, actingUserId);
}
