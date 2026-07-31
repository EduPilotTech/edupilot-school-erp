import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, SalaryComponent as PrismaSalaryComponent } from "@/lib/generated/prisma/client";
import type {
  CreateSalaryComponentInput,
  SalaryComponentRepository,
  UpdateSalaryComponentInput,
} from "../domain/salary-structure.repository";
import type { SalaryCalculationTypeValue, SalaryComponentEntity, SalaryComponentTypeValue } from "../domain/salary-structure.entity";

function toEntity(row: PrismaSalaryComponent): SalaryComponentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    salaryStructureId: row.salaryStructureId,
    name: row.name,
    code: row.code,
    componentType: row.componentType as SalaryComponentTypeValue,
    calculationType: row.calculationType as SalaryCalculationTypeValue,
    value: row.value.toNumber(),
    isStatutory: row.isStatutory,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSalaryComponentRepository implements SalaryComponentRepository {
  async findById(tenantId: string, id: string): Promise<SalaryComponentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.salaryComponent.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, salaryStructureId: string, code: string): Promise<SalaryComponentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.salaryComponent.findUnique({
        where: { tenantId_salaryStructureId_code: { tenantId, salaryStructureId, code } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByStructure(tenantId: string, salaryStructureId: string, activeOnly?: boolean): Promise<SalaryComponentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.salaryComponent.findMany({
        where: {
          tenantId,
          salaryStructureId,
          deletedAt: null,
          isActive: activeOnly ? true : undefined,
        },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateSalaryComponentInput, tx?: Prisma.TransactionClient): Promise<SalaryComponentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.salaryComponent.create({
          data: {
            tenantId: input.tenantId,
            salaryStructureId: input.salaryStructureId,
            name: input.name,
            code: input.code,
            componentType: input.componentType,
            calculationType: input.calculationType,
            value: input.value,
            isStatutory: input.isStatutory ?? false,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateSalaryComponentInput,
    tx?: Prisma.TransactionClient
  ): Promise<SalaryComponentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.salaryComponent.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            name: input.name,
            componentType: input.componentType,
            calculationType: input.calculationType,
            value: input.value,
            isStatutory: input.isStatutory,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(
    tenantId: string,
    id: string,
    deletedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<SalaryComponentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.salaryComponent.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
