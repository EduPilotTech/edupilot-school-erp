import type { HostelFloorEntity } from "./hostel-floor.entity";

export interface CreateHostelFloorInput {
  tenantId: string;
  buildingId: string;
  name: string;
  floorNumber: number;
  createdBy?: string | null;
}

export interface UpdateHostelFloorInput {
  name?: string;
  floorNumber?: number;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HostelFloorRepository {
  findById(tenantId: string, id: string): Promise<HostelFloorEntity | null>;
  findByBuilding(tenantId: string, buildingId: string): Promise<HostelFloorEntity[]>;
  create(input: CreateHostelFloorInput): Promise<HostelFloorEntity>;
  update(tenantId: string, id: string, input: UpdateHostelFloorInput): Promise<HostelFloorEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelFloorEntity>;
}
