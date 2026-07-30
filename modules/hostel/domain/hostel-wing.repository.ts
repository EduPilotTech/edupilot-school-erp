import type { HostelWingEntity } from "./hostel-wing.entity";

export interface CreateHostelWingInput {
  tenantId: string;
  buildingId: string;
  name: string;
  createdBy?: string | null;
}

export interface UpdateHostelWingInput {
  name?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HostelWingRepository {
  findById(tenantId: string, id: string): Promise<HostelWingEntity | null>;
  findByBuilding(tenantId: string, buildingId: string): Promise<HostelWingEntity[]>;
  create(input: CreateHostelWingInput): Promise<HostelWingEntity>;
  update(tenantId: string, id: string, input: UpdateHostelWingInput): Promise<HostelWingEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelWingEntity>;
}
