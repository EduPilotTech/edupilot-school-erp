import type { ShelfEntity } from "./shelf.entity";

export interface CreateShelfInput {
  tenantId: string;
  rackId: string;
  name: string;
  code: string;
  createdBy?: string | null;
}

export interface UpdateShelfInput {
  name?: string;
  code?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface ShelfRepository {
  findById(tenantId: string, id: string): Promise<ShelfEntity | null>;
  findByRack(tenantId: string, rackId: string, filter?: { isActive?: boolean }): Promise<ShelfEntity[]>;
  create(input: CreateShelfInput): Promise<ShelfEntity>;
  update(tenantId: string, id: string, input: UpdateShelfInput): Promise<ShelfEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ShelfEntity>;
}
