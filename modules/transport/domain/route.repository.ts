import type { RouteEntity } from "./route.entity";

export interface CreateRouteInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateRouteInput {
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface RouteRepository {
  findById(tenantId: string, id: string): Promise<RouteEntity | null>;
  findByCode(tenantId: string, code: string): Promise<RouteEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<RouteEntity[]>;
  create(input: CreateRouteInput): Promise<RouteEntity>;
  update(tenantId: string, id: string, input: UpdateRouteInput): Promise<RouteEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RouteEntity>;
}
