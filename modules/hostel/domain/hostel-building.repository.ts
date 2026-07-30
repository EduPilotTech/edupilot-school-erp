import type { HostelBuildingEntity } from "./hostel-building.entity";

export interface CreateHostelBuildingInput {
  tenantId: string;
  hostelId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateHostelBuildingInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HostelBuildingRepository {
  findById(tenantId: string, id: string): Promise<HostelBuildingEntity | null>;
  findByHostel(tenantId: string, hostelId: string): Promise<HostelBuildingEntity[]>;
  create(input: CreateHostelBuildingInput): Promise<HostelBuildingEntity>;
  update(tenantId: string, id: string, input: UpdateHostelBuildingInput): Promise<HostelBuildingEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelBuildingEntity>;
}
