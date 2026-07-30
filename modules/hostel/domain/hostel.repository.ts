import type { HostelEntity, HostelTypeValue } from "./hostel.entity";

export interface CreateHostelInput {
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  type: HostelTypeValue;
  address?: string | null;
  createdBy?: string | null;
}

export interface UpdateHostelInput {
  name?: string;
  code?: string;
  type?: HostelTypeValue;
  address?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HostelRepository {
  findById(tenantId: string, id: string): Promise<HostelEntity | null>;
  findByCode(tenantId: string, code: string): Promise<HostelEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<HostelEntity[]>;
  create(input: CreateHostelInput): Promise<HostelEntity>;
  update(tenantId: string, id: string, input: UpdateHostelInput): Promise<HostelEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelEntity>;
}
