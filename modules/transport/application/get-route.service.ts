import "server-only";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { toRouteDTO } from "./create-route.service";
import type { RouteDTO } from "./dto/route.dto";

export async function getRoute(tenantId: string, routeId: string): Promise<RouteDTO | null> {
  const repository = new PrismaRouteRepository();
  const route = await repository.findById(tenantId, routeId);
  return route ? toRouteDTO(route) : null;
}
