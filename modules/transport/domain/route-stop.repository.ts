import type { Prisma } from "@/lib/generated/prisma/client";
import type { RouteStopEntity } from "./route-stop.entity";

export interface CreateRouteStopInput {
  tenantId: string;
  routeId: string;
  name: string;
  sequenceOrder: number;
  pickupTime?: string | null;
  dropTime?: string | null;
  landmark?: string | null;
  createdBy?: string | null;
}

export interface UpdateRouteStopInput {
  name?: string;
  sequenceOrder?: number;
  pickupTime?: string | null;
  dropTime?: string | null;
  landmark?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface RouteStopRepository {
  findById(tenantId: string, id: string): Promise<RouteStopEntity | null>;
  findByRoute(tenantId: string, routeId: string): Promise<RouteStopEntity[]>;
  create(input: CreateRouteStopInput, tx?: Prisma.TransactionClient): Promise<RouteStopEntity>;
  update(tenantId: string, id: string, input: UpdateRouteStopInput): Promise<RouteStopEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RouteStopEntity>;
}
