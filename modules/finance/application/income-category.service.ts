import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaIncomeCategoryRepository } from "../infrastructure/prisma-income-category.repository";
import { IncomeCategoryAlreadyExistsError, IncomeCategoryNotFoundError } from "../domain/errors";
import { createIncomeCategorySchema, updateIncomeCategorySchema, type IncomeCategoryDTO } from "./dto/finance-category.dto";
import type { IncomeCategoryEntity } from "../domain/income-category.entity";
import type { FinanceContext } from "./finance-context";

const repository = new PrismaIncomeCategoryRepository();

function toDTO(entity: IncomeCategoryEntity): IncomeCategoryDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createIncomeCategory(input: unknown, context: FinanceContext & { schoolId: string }): Promise<IncomeCategoryDTO> {
  const parsed = createIncomeCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid income category data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new IncomeCategoryAlreadyExistsError();

  try {
    const category = await repository.create({ tenantId, schoolId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new IncomeCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateIncomeCategory(id: string, input: unknown, context: FinanceContext): Promise<IncomeCategoryDTO> {
  const parsed = updateIncomeCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid income category data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new IncomeCategoryNotFoundError();

  try {
    const category = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new IncomeCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function softDeleteIncomeCategory(id: string, context: FinanceContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new IncomeCategoryNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function getIncomeCategory(tenantId: string, id: string): Promise<IncomeCategoryDTO> {
  const category = await repository.findById(tenantId, id);
  if (!category || category.deletedAt !== null) throw new IncomeCategoryNotFoundError();
  return toDTO(category);
}

export async function listIncomeCategories(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<IncomeCategoryDTO[]> {
  const categories = await repository.findMany(context.tenantId, filter);
  return categories.map(toDTO);
}

export { toDTO as toIncomeCategoryDTO };
