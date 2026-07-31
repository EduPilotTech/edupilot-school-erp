import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  SalaryCalculationTypeValue,
  SalaryComponentEntity,
  SalaryComponentTypeValue,
  SalaryStructureEntity,
} from "./salary-structure.entity";

export interface CreateSalaryStructureInput {
  tenantId: string;
  schoolId: string;
  name: string;
  createdBy?: string | null;
}

export interface UpdateSalaryStructureInput {
  name?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface SalaryStructureRepository {
  findById(tenantId: string, id: string): Promise<SalaryStructureEntity | null>;
  findByName(tenantId: string, schoolId: string, name: string): Promise<SalaryStructureEntity | null>;
  findBySchool(tenantId: string, schoolId: string): Promise<SalaryStructureEntity[]>;
  create(input: CreateSalaryStructureInput, tx?: Prisma.TransactionClient): Promise<SalaryStructureEntity>;
  update(tenantId: string, id: string, input: UpdateSalaryStructureInput, tx?: Prisma.TransactionClient): Promise<SalaryStructureEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<SalaryStructureEntity>;
}

export interface CreateSalaryComponentInput {
  tenantId: string;
  salaryStructureId: string;
  name: string;
  code: string;
  componentType: SalaryComponentTypeValue;
  calculationType: SalaryCalculationTypeValue;
  value: number;
  isStatutory?: boolean;
  createdBy?: string | null;
}

export interface UpdateSalaryComponentInput {
  name?: string;
  componentType?: SalaryComponentTypeValue;
  calculationType?: SalaryCalculationTypeValue;
  value?: number;
  isStatutory?: boolean;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface SalaryComponentRepository {
  findById(tenantId: string, id: string): Promise<SalaryComponentEntity | null>;
  findByCode(tenantId: string, salaryStructureId: string, code: string): Promise<SalaryComponentEntity | null>;
  findByStructure(tenantId: string, salaryStructureId: string, activeOnly?: boolean): Promise<SalaryComponentEntity[]>;
  create(input: CreateSalaryComponentInput, tx?: Prisma.TransactionClient): Promise<SalaryComponentEntity>;
  update(tenantId: string, id: string, input: UpdateSalaryComponentInput, tx?: Prisma.TransactionClient): Promise<SalaryComponentEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<SalaryComponentEntity>;
}
