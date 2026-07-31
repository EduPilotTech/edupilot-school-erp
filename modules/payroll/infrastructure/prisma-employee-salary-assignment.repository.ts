import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, EmployeeSalaryAssignment as PrismaEmployeeSalaryAssignment } from "@/lib/generated/prisma/client";
import type {
  CreateEmployeeSalaryAssignmentInput,
  EmployeeSalaryAssignmentRepository,
} from "../domain/employee-salary-assignment.repository";
import type { EmployeeSalaryAssignmentEntity } from "../domain/employee-salary-assignment.entity";

function toEntity(row: PrismaEmployeeSalaryAssignment): EmployeeSalaryAssignmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    salaryStructureId: row.salaryStructureId,
    basicSalary: row.basicSalary.toNumber(),
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaEmployeeSalaryAssignmentRepository implements EmployeeSalaryAssignmentRepository {
  async findCurrentForEmployee(tenantId: string, employeeId: string): Promise<EmployeeSalaryAssignmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employeeSalaryAssignment.findFirst({
        where: { tenantId, employeeId, effectiveTo: null },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findHistoryForEmployee(tenantId: string, employeeId: string): Promise<EmployeeSalaryAssignmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.employeeSalaryAssignment.findMany({
        where: { tenantId, employeeId },
        orderBy: { effectiveFrom: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateEmployeeSalaryAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeSalaryAssignmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employeeSalaryAssignment.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            salaryStructureId: input.salaryStructureId,
            basicSalary: input.basicSalary,
            effectiveFrom: input.effectiveFrom,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async close(
    tenantId: string,
    id: string,
    effectiveTo: Date,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeSalaryAssignmentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeSalaryAssignment.update({
          where: { tenantId_id: { tenantId, id } },
          data: { effectiveTo, updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
