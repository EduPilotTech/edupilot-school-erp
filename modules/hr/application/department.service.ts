import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { DepartmentAlreadyExistsError, DepartmentNotFoundError } from "../domain/errors";
import { createDepartmentSchema, updateDepartmentSchema, type DepartmentDTO } from "./dto/hr-master.dto";
import type { DepartmentEntity } from "../domain/department.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: DepartmentEntity): DepartmentDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createDepartment(input: unknown, context: HrContext & { schoolId: string }): Promise<DepartmentDTO> {
  const parsed = createDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid department data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaDepartmentRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new DepartmentAlreadyExistsError();

  try {
    const department = await repository.create({ tenantId, schoolId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(department);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DepartmentAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateDepartment(id: string, input: unknown, context: HrContext): Promise<DepartmentDTO> {
  const parsed = updateDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid department data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaDepartmentRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new DepartmentNotFoundError();

  try {
    const department = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(department);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DepartmentAlreadyExistsError();
    }
    throw error;
  }
}

export async function softDeleteDepartment(id: string, context: HrContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaDepartmentRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new DepartmentNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function getDepartmentById(id: string, context: { tenantId: string }): Promise<DepartmentDTO> {
  const repository = new PrismaDepartmentRepository();
  const department = await repository.findById(context.tenantId, id);
  if (!department || department.deletedAt !== null) throw new DepartmentNotFoundError();
  return toDTO(department);
}

export async function listDepartments(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<DepartmentDTO[]> {
  const repository = new PrismaDepartmentRepository();
  const departments = await repository.findMany(context.tenantId, filter);
  return departments.map(toDTO);
}

export { toDTO as toDepartmentDTO };
