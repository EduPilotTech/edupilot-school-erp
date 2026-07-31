import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaEmploymentTypeRepository } from "../infrastructure/prisma-employment-type.repository";
import { EmploymentTypeAlreadyExistsError, EmploymentTypeNotFoundError } from "../domain/errors";
import { createEmploymentTypeSchema, updateEmploymentTypeSchema, type EmploymentTypeDTO } from "./dto/hr-master.dto";
import type { EmploymentTypeEntity } from "../domain/employment-type.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: EmploymentTypeEntity): EmploymentTypeDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createEmploymentType(input: unknown, context: HrContext & { schoolId: string }): Promise<EmploymentTypeDTO> {
  const parsed = createEmploymentTypeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employment type data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaEmploymentTypeRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new EmploymentTypeAlreadyExistsError();

  try {
    const employmentType = await repository.create({ tenantId, schoolId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(employmentType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmploymentTypeAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateEmploymentType(id: string, input: unknown, context: HrContext): Promise<EmploymentTypeDTO> {
  const parsed = updateEmploymentTypeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid employment type data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaEmploymentTypeRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new EmploymentTypeNotFoundError();

  try {
    const employmentType = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(employmentType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmploymentTypeAlreadyExistsError();
    }
    throw error;
  }
}

export async function softDeleteEmploymentType(id: string, context: HrContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaEmploymentTypeRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new EmploymentTypeNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function getEmploymentTypeById(id: string, context: { tenantId: string }): Promise<EmploymentTypeDTO> {
  const repository = new PrismaEmploymentTypeRepository();
  const employmentType = await repository.findById(context.tenantId, id);
  if (!employmentType || employmentType.deletedAt !== null) throw new EmploymentTypeNotFoundError();
  return toDTO(employmentType);
}

export async function listEmploymentTypes(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<EmploymentTypeDTO[]> {
  const repository = new PrismaEmploymentTypeRepository();
  const employmentTypes = await repository.findMany(context.tenantId, filter);
  return employmentTypes.map(toDTO);
}

export { toDTO as toEmploymentTypeDTO };
