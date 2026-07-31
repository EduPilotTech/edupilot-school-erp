import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { PrismaDesignationRepository } from "../infrastructure/prisma-designation.repository";
import { PrismaEmploymentTypeRepository } from "../infrastructure/prisma-employment-type.repository";
import {
  EmployeeAlreadyExistsError,
  EmployeeNotFoundError,
  InvalidReportingManagerError,
  DepartmentNotFoundError,
  DesignationNotFoundError,
  EmploymentTypeNotFoundError,
} from "../domain/errors";
import { createEmployeeSchema, listEmployeesSchema, updateEmployeeSchema, type EmployeeDTO, type EmployeeListResultDTO } from "./dto/employee.dto";
import type { EmployeeEntity } from "../domain/employee.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: EmployeeEntity, identity: { fullName: string; email: string | null; phone: string | null }): EmployeeDTO {
  return {
    id: entity.id,
    userProfileId: entity.userProfileId,
    fullName: identity.fullName,
    email: identity.email,
    phone: identity.phone,
    schoolId: entity.schoolId,
    departmentId: entity.departmentId,
    designationId: entity.designationId,
    employmentTypeId: entity.employmentTypeId,
    reportingManagerId: entity.reportingManagerId,
    employeeCode: entity.employeeCode,
    joiningDate: entity.joiningDate,
    confirmationDate: entity.confirmationDate,
    employmentStatus: entity.employmentStatus,
    qualification: entity.qualification,
    experienceYears: entity.experienceYears,
    emergencyContactName: entity.emergencyContactName,
    emergencyContactPhone: entity.emergencyContactPhone,
    emergencyContactRelation: entity.emergencyContactRelation,
    isActive: entity.isActive,
  };
}

async function assertRefsExist(
  tenantId: string,
  refs: { departmentId?: string; designationId?: string; employmentTypeId?: string; reportingManagerId?: string | null }
): Promise<void> {
  if (refs.departmentId) {
    const department = await new PrismaDepartmentRepository().findById(tenantId, refs.departmentId);
    if (!department || department.deletedAt !== null) throw new DepartmentNotFoundError();
  }
  if (refs.designationId) {
    const designation = await new PrismaDesignationRepository().findById(tenantId, refs.designationId);
    if (!designation || designation.deletedAt !== null) throw new DesignationNotFoundError();
  }
  if (refs.employmentTypeId) {
    const employmentType = await new PrismaEmploymentTypeRepository().findById(tenantId, refs.employmentTypeId);
    if (!employmentType || employmentType.deletedAt !== null) throw new EmploymentTypeNotFoundError();
  }
  if (refs.reportingManagerId) {
    const manager = await new PrismaEmployeeRepository().findById(tenantId, refs.reportingManagerId);
    if (!manager || manager.deletedAt !== null) throw new EmployeeNotFoundError("Reporting manager not found.");
  }
}

// Promotes an existing UserProfile into an Employee record — never creates a new UserProfile,
// mirroring modules/teachers/application/create-teacher.service.ts's exact precedent (Phase 6
// Decision 1: UserProfile remains the identity, Employee is a 1:1 extension).
export async function createEmployee(input: unknown, context: HrContext & { schoolId: string }): Promise<EmployeeDTO> {
  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employee data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const userDetail = await getUserDetail(data.userProfileId, { tenantId });
  if (!userDetail || userDetail.profile.deletedAt !== null) {
    throw new EmployeeNotFoundError("User not found.");
  }

  const repository = new PrismaEmployeeRepository();
  const existingByUser = await repository.findByUserProfileId(tenantId, data.userProfileId);
  if (existingByUser) {
    throw new EmployeeAlreadyExistsError("This staff member already has an employee record.");
  }
  const existingByCode = await repository.findByEmployeeCode(tenantId, data.employeeCode);
  if (existingByCode) {
    throw new EmployeeAlreadyExistsError("This employee code is already in use.");
  }

  await assertRefsExist(tenantId, {
    departmentId: data.departmentId,
    designationId: data.designationId,
    employmentTypeId: data.employmentTypeId,
    reportingManagerId: data.reportingManagerId,
  });

  try {
    const employee = await repository.create({
      tenantId,
      schoolId,
      userProfileId: data.userProfileId,
      departmentId: data.departmentId,
      designationId: data.designationId,
      employmentTypeId: data.employmentTypeId,
      reportingManagerId: data.reportingManagerId ?? null,
      employeeCode: data.employeeCode,
      joiningDate: data.joiningDate,
      confirmationDate: data.confirmationDate ?? null,
      employmentStatus: data.employmentStatus,
      qualification: data.qualification ?? null,
      experienceYears: data.experienceYears ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      emergencyContactRelation: data.emergencyContactRelation ?? null,
      createdBy: actingUserId,
    });
    return toDTO(employee, userDetail.profile);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmployeeAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateEmployee(employeeId: string, input: unknown, context: HrContext): Promise<EmployeeDTO> {
  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employee data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaEmployeeRepository();
  const existing = await repository.findById(tenantId, employeeId);
  if (!existing || existing.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  if (data.reportingManagerId && data.reportingManagerId === employeeId) {
    throw new InvalidReportingManagerError();
  }

  await assertRefsExist(tenantId, {
    departmentId: data.departmentId,
    designationId: data.designationId,
    employmentTypeId: data.employmentTypeId,
    reportingManagerId: data.reportingManagerId,
  });

  const employee = await repository.update(tenantId, employeeId, {
    departmentId: data.departmentId,
    designationId: data.designationId,
    employmentTypeId: data.employmentTypeId,
    reportingManagerId: data.reportingManagerId,
    joiningDate: data.joiningDate,
    confirmationDate: data.confirmationDate,
    employmentStatus: data.employmentStatus,
    qualification: data.qualification,
    experienceYears: data.experienceYears,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    emergencyContactRelation: data.emergencyContactRelation,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });

  const userDetail = await getUserDetail(employee.userProfileId, { tenantId });
  if (!userDetail) throw new EmployeeNotFoundError();

  return toDTO(employee, userDetail.profile);
}

export async function softDeleteEmployee(employeeId: string, context: HrContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaEmployeeRepository();
  const existing = await repository.findById(tenantId, employeeId);
  if (!existing || existing.deletedAt !== null) throw new EmployeeNotFoundError();
  await repository.softDelete(tenantId, employeeId, actingUserId);
}

export async function getEmployeeById(employeeId: string, context: { tenantId: string }): Promise<EmployeeDTO> {
  const repository = new PrismaEmployeeRepository();
  const employee = await repository.findById(context.tenantId, employeeId);
  if (!employee || employee.deletedAt !== null) throw new EmployeeNotFoundError();

  const userDetail = await getUserDetail(employee.userProfileId, { tenantId: context.tenantId });
  if (!userDetail) throw new EmployeeNotFoundError();

  return toDTO(employee, userDetail.profile);
}

export async function listEmployees(input: unknown, context: { tenantId: string }): Promise<EmployeeListResultDTO> {
  const parsed = listEmployeesSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid list filter.");
  }
  const { tenantId } = context;
  const repository = new PrismaEmployeeRepository();

  const result = await repository.findMany(tenantId, parsed.data);

  const items = await Promise.all(
    result.items.map(async (employee) => {
      const userDetail = await getUserDetail(employee.userProfileId, { tenantId });
      return toDTO(employee, userDetail?.profile ?? { fullName: "", email: null, phone: null });
    })
  );

  return { items, total: result.total, page: result.page, pageSize: result.pageSize };
}

export { toDTO as toEmployeeDTO };
