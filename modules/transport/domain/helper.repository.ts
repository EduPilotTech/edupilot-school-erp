import type { HelperEntity } from "./helper.entity";

export interface CreateHelperInput {
  tenantId: string;
  employeeCode: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  dateOfJoining?: Date | null;
  createdBy?: string | null;
}

export interface UpdateHelperInput {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  dateOfJoining?: Date | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface HelperRepository {
  findById(tenantId: string, id: string): Promise<HelperEntity | null>;
  findByEmployeeCode(tenantId: string, employeeCode: string): Promise<HelperEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<HelperEntity[]>;
  create(input: CreateHelperInput): Promise<HelperEntity>;
  update(tenantId: string, id: string, input: UpdateHelperInput): Promise<HelperEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HelperEntity>;
}
