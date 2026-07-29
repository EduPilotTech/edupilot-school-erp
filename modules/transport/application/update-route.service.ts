import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { RouteAlreadyExistsError, RouteNotFoundError } from "../domain/errors";
import { updateRouteSchema, type RouteDTO } from "./dto/route.dto";
import { toRouteDTO } from "./create-route.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateRoute(routeId: string, input: unknown, context: TransportContext): Promise<RouteDTO> {
  const parsed = updateRouteSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid route data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaRouteRepository();
  const existing = await repository.findById(tenantId, routeId);
  if (!existing || existing.deletedAt !== null) {
    throw new RouteNotFoundError();
  }

  try {
    const route = await repository.update(tenantId, routeId, {
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toRouteDTO(route);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RouteAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteRoute(routeId: string, context: TransportContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaRouteRepository();
  const existing = await repository.findById(tenantId, routeId);
  if (!existing || existing.deletedAt !== null) {
    throw new RouteNotFoundError();
  }
  await repository.softDelete(tenantId, routeId, actingUserId);
}
