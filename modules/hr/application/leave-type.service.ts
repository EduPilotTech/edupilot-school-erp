import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaLeaveTypeRepository } from "../infrastructure/prisma-leave-type.repository";
import { LeaveTypeAlreadyExistsError, LeaveTypeNotFoundError } from "../domain/errors";
import { createLeaveTypeSchema, updateLeaveTypeSchema, type LeaveTypeDTO } from "./dto/leave.dto";
import type { LeaveTypeEntity } from "../domain/leave-type.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: LeaveTypeEntity): LeaveTypeDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    code: entity.code,
    maxDaysPerYear: entity.maxDaysPerYear,
    carryForwardAllowed: entity.carryForwardAllowed,
    carryForwardMaxDays: entity.carryForwardMaxDays,
    isActive: entity.isActive,
  };
}

export async function createLeaveType(input: unknown, context: HrContext & { schoolId: string }): Promise<LeaveTypeDTO> {
  const parsed = createLeaveTypeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid leave type data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaLeaveTypeRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new LeaveTypeAlreadyExistsError();

  try {
    const leaveType = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      maxDaysPerYear: data.maxDaysPerYear,
      carryForwardAllowed: data.carryForwardAllowed,
      carryForwardMaxDays: data.carryForwardMaxDays ?? null,
      createdBy: actingUserId,
    });
    return toDTO(leaveType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new LeaveTypeAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateLeaveType(id: string, input: unknown, context: HrContext): Promise<LeaveTypeDTO> {
  const parsed = updateLeaveTypeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid leave type data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaLeaveTypeRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new LeaveTypeNotFoundError();

  try {
    const leaveType = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(leaveType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new LeaveTypeAlreadyExistsError();
    }
    throw error;
  }
}

export async function softDeleteLeaveType(id: string, context: HrContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaLeaveTypeRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new LeaveTypeNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function getLeaveTypeById(id: string, context: { tenantId: string }): Promise<LeaveTypeDTO> {
  const repository = new PrismaLeaveTypeRepository();
  const leaveType = await repository.findById(context.tenantId, id);
  if (!leaveType || leaveType.deletedAt !== null) throw new LeaveTypeNotFoundError();
  return toDTO(leaveType);
}

export async function listLeaveTypes(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<LeaveTypeDTO[]> {
  const repository = new PrismaLeaveTypeRepository();
  const leaveTypes = await repository.findMany(context.tenantId, filter);
  return leaveTypes.map(toDTO);
}

export { toDTO as toLeaveTypeDTO };
