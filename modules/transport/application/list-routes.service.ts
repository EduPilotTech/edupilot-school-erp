import "server-only";
import { PrismaRouteRepository } from "../infrastructure/prisma-route.repository";
import { toRouteDTO } from "./create-route.service";
import type { RouteDTO } from "./dto/route.dto";

export async function listRoutes(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<RouteDTO[]> {
  const repository = new PrismaRouteRepository();
  const routes = await repository.findMany(context.tenantId, filter);
  return routes.map(toRouteDTO);
}
