import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Driver as PrismaDriver } from "@/lib/generated/prisma/client";
import type { CreateDriverInput, DriverRepository, UpdateDriverInput } from "../domain/driver.repository";
import type { DriverEntity } from "../domain/driver.entity";

function toEntity(row: PrismaDriver): DriverEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userProfileId: row.userProfileId,
    employeeCode: row.employeeCode,
    fullName: row.fullName,
    phone: row.phone,
    address: row.address,
    licenseNumber: row.licenseNumber,
    licenseType: row.licenseType,
    licenseExpiryDate: row.licenseExpiryDate,
    dateOfJoining: row.dateOfJoining,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaDriverRepository implements DriverRepository {
  async findById(tenantId: string, id: string): Promise<DriverEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.driver.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployeeCode(tenantId: string, employeeCode: string): Promise<DriverEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.driver.findUnique({ where: { tenantId_employeeCode: { tenantId, employeeCode } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<DriverEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.driver.findMany({
        where: { tenantId, deletedAt: null, isActive: filter?.isActive },
        orderBy: { fullName: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateDriverInput): Promise<DriverEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.driver.create({
        data: {
          tenantId: input.tenantId,
          employeeCode: input.employeeCode,
          fullName: input.fullName,
          phone: input.phone ?? null,
          address: input.address ?? null,
          licenseNumber: input.licenseNumber,
          licenseType: input.licenseType ?? null,
          licenseExpiryDate: input.licenseExpiryDate ?? null,
          dateOfJoining: input.dateOfJoining ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateDriverInput): Promise<DriverEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.driver.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          address: input.address,
          licenseNumber: input.licenseNumber,
          licenseType: input.licenseType,
          licenseExpiryDate: input.licenseExpiryDate,
          dateOfJoining: input.dateOfJoining,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<DriverEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.driver.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
