import type { DriverEntity } from "./driver.entity";

export interface CreateDriverInput {
  tenantId: string;
  employeeCode: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  licenseNumber: string;
  licenseType?: string | null;
  licenseExpiryDate?: Date | null;
  dateOfJoining?: Date | null;
  createdBy?: string | null;
}

export interface UpdateDriverInput {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  licenseNumber?: string;
  licenseType?: string | null;
  licenseExpiryDate?: Date | null;
  dateOfJoining?: Date | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface DriverRepository {
  findById(tenantId: string, id: string): Promise<DriverEntity | null>;
  findByEmployeeCode(tenantId: string, employeeCode: string): Promise<DriverEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<DriverEntity[]>;
  create(input: CreateDriverInput): Promise<DriverEntity>;
  update(tenantId: string, id: string, input: UpdateDriverInput): Promise<DriverEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<DriverEntity>;
}
