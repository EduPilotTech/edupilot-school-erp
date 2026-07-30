import type { RackEntity } from "./rack.entity";

export interface CreateRackInput {
  tenantId: string;
  libraryId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateRackInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface RackRepository {
  findById(tenantId: string, id: string): Promise<RackEntity | null>;
  findByLibrary(tenantId: string, libraryId: string, filter?: { isActive?: boolean }): Promise<RackEntity[]>;
  create(input: CreateRackInput): Promise<RackEntity>;
  update(tenantId: string, id: string, input: UpdateRackInput): Promise<RackEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RackEntity>;
}
