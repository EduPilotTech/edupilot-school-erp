import "server-only";
import { PrismaRouteStopRepository } from "../infrastructure/prisma-route-stop.repository";
import { toRouteStopDTO } from "./create-route-stop.service";
import type { RouteStopDTO } from "./dto/route.dto";

export async function listRouteStops(context: { tenantId: string }, routeId: string): Promise<RouteStopDTO[]> {
  const repository = new PrismaRouteStopRepository();
  const stops = await repository.findByRoute(context.tenantId, routeId);
  return stops.map(toRouteStopDTO);
}
