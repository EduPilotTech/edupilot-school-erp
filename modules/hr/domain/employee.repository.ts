import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeEntity, EmploymentStatusValue } from "./employee.entity";

export interface CreateEmployeeInput {
  tenantId: string;
  schoolId: string;
  userProfileId: string;
  departmentId: string;
  designationId: string;
  employmentTypeId: string;
  reportingManagerId?: string | null;
  employeeCode: string;
  joiningDate: Date;
  confirmationDate?: Date | null;
  employmentStatus?: EmploymentStatusValue;
  qualification?: string | null;
  experienceYears?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  createdBy?: string | null;
}

export interface UpdateEmployeeInput {
  departmentId?: string;
  designationId?: string;
  employmentTypeId?: string;
  reportingManagerId?: string | null;
  joiningDate?: Date;
  confirmationDate?: Date | null;
  employmentStatus?: EmploymentStatusValue;
  qualification?: string | null;
  experienceYears?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface EmployeeListFilter {
  page: number;
  pageSize: number;
  departmentId?: string;
  employmentStatus?: EmploymentStatusValue;
  search?: string; // matches employeeCode
}

export interface EmployeeListResult {
  items: EmployeeEntity[];
  total: number;
  page: number;
  pageSize: number;
}

// Every method takes `tenantId` explicitly, per docs/DATABASE_STANDARDS.md — no ambient tenant
// context in the repository layer.
export interface EmployeeRepository {
  findById(tenantId: string, id: string): Promise<EmployeeEntity | null>;
  findByUserProfileId(tenantId: string, userProfileId: string): Promise<EmployeeEntity | null>;
  findByEmployeeCode(tenantId: string, employeeCode: string): Promise<EmployeeEntity | null>;
  findMany(tenantId: string, filter: EmployeeListFilter): Promise<EmployeeListResult>;
  create(input: CreateEmployeeInput, tx?: Prisma.TransactionClient): Promise<EmployeeEntity>;
  update(tenantId: string, id: string, input: UpdateEmployeeInput, tx?: Prisma.TransactionClient): Promise<EmployeeEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmployeeEntity>;
}
