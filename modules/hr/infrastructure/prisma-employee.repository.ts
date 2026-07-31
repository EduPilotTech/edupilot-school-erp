import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Employee as PrismaEmployee, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateEmployeeInput,
  EmployeeListFilter,
  EmployeeListResult,
  EmployeeRepository,
  UpdateEmployeeInput,
} from "../domain/employee.repository";
import type { EmployeeEntity, EmploymentStatusValue } from "../domain/employee.entity";

function toEntity(row: PrismaEmployee): EmployeeEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    userProfileId: row.userProfileId,
    departmentId: row.departmentId,
    designationId: row.designationId,
    employmentTypeId: row.employmentTypeId,
    reportingManagerId: row.reportingManagerId,
    employeeCode: row.employeeCode,
    joiningDate: row.joiningDate,
    confirmationDate: row.confirmationDate,
    employmentStatus: row.employmentStatus as EmploymentStatusValue,
    qualification: row.qualification,
    experienceYears: row.experienceYears,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    emergencyContactRelation: row.emergencyContactRelation,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Every tenant-scoped lookup/write uses a `tenantId_*` compound unique, not a bare `where: { id }`
// — matches PrismaTeacherRepository's own precedent.
export class PrismaEmployeeRepository implements EmployeeRepository {
  async findById(tenantId: string, id: string): Promise<EmployeeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employee.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByUserProfileId(tenantId: string, userProfileId: string): Promise<EmployeeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employee.findUnique({ where: { tenantId_userProfileId: { tenantId, userProfileId } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployeeCode(tenantId: string, employeeCode: string): Promise<EmployeeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employee.findUnique({ where: { tenantId_employeeCode: { tenantId, employeeCode } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: EmployeeListFilter): Promise<EmployeeListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where: Prisma.EmployeeWhereInput = {
        tenantId,
        deletedAt: null,
        departmentId: filter.departmentId,
        employmentStatus: filter.employmentStatus,
        employeeCode: filter.search ? { contains: filter.search, mode: "insensitive" } : undefined,
      };

      const [rows, total] = await Promise.all([
        tx.employee.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.employee.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateEmployeeInput, tx?: Prisma.TransactionClient): Promise<EmployeeEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employee.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            userProfileId: input.userProfileId,
            departmentId: input.departmentId,
            designationId: input.designationId,
            employmentTypeId: input.employmentTypeId,
            reportingManagerId: input.reportingManagerId ?? null,
            employeeCode: input.employeeCode,
            joiningDate: input.joiningDate,
            confirmationDate: input.confirmationDate ?? null,
            employmentStatus: input.employmentStatus ?? "ACTIVE",
            qualification: input.qualification ?? null,
            experienceYears: input.experienceYears ?? null,
            emergencyContactName: input.emergencyContactName ?? null,
            emergencyContactPhone: input.emergencyContactPhone ?? null,
            emergencyContactRelation: input.emergencyContactRelation ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateEmployeeInput, tx?: Prisma.TransactionClient): Promise<EmployeeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employee.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            departmentId: input.departmentId,
            designationId: input.designationId,
            employmentTypeId: input.employmentTypeId,
            reportingManagerId: input.reportingManagerId,
            joiningDate: input.joiningDate,
            confirmationDate: input.confirmationDate,
            employmentStatus: input.employmentStatus,
            qualification: input.qualification,
            experienceYears: input.experienceYears,
            emergencyContactName: input.emergencyContactName,
            emergencyContactPhone: input.emergencyContactPhone,
            emergencyContactRelation: input.emergencyContactRelation,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmployeeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employee.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
