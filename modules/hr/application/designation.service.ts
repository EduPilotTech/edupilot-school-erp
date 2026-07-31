import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaDesignationRepository } from "../infrastructure/prisma-designation.repository";
import { PrismaDepartmentRepository } from "../infrastructure/prisma-department.repository";
import { DesignationAlreadyExistsError, DesignationNotFoundError, DepartmentNotFoundError } from "../domain/errors";
import { createDesignationSchema, updateDesignationSchema, type DesignationDTO } from "./dto/hr-master.dto";
import type { DesignationEntity } from "../domain/designation.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: DesignationEntity): DesignationDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    departmentId: entity.departmentId,
    name: entity.name,
    code: entity.code,
    isActive: entity.isActive,
  };
}

async function assertDepartmentExists(tenantId: string, departmentId: string): Promise<void> {
  const department = await new PrismaDepartmentRepository().findById(tenantId, departmentId);
  if (!department || department.deletedAt !== null) throw new DepartmentNotFoundError();
}

export async function createDesignation(input: unknown, context: HrContext & { schoolId: string }): Promise<DesignationDTO> {
  const parsed = createDesignationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid designation data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  if (data.departmentId) {
    await assertDepartmentExists(tenantId, data.departmentId);
  }

  const repository = new PrismaDesignationRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new DesignationAlreadyExistsError();

  try {
    const designation = await repository.create({
      tenantId,
      schoolId,
      departmentId: data.departmentId ?? null,
      name: data.name,
      code: data.code,
      createdBy: actingUserId,
    });
    return toDTO(designation);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DesignationAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateDesignation(id: string, input: unknown, context: HrContext): Promise<DesignationDTO> {
  const parsed = updateDesignationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid designation data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaDesignationRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new DesignationNotFoundError();

  if (data.departmentId) {
    await assertDepartmentExists(tenantId, data.departmentId);
  }

  try {
    const designation = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(designation);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DesignationAlreadyExistsError();
    }
    throw error;
  }
}

export async function softDeleteDesignation(id: string, context: HrContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaDesignationRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new DesignationNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function getDesignationById(id: string, context: { tenantId: string }): Promise<DesignationDTO> {
  const repository = new PrismaDesignationRepository();
  const designation = await repository.findById(context.tenantId, id);
  if (!designation || designation.deletedAt !== null) throw new DesignationNotFoundError();
  return toDTO(designation);
}

export async function listDesignations(
  context: { tenantId: string },
  filter?: { isActive?: boolean; departmentId?: string }
): Promise<DesignationDTO[]> {
  const repository = new PrismaDesignationRepository();
  const designations = await repository.findMany(context.tenantId, filter);
  return designations.map(toDTO);
}

export { toDTO as toDesignationDTO };
