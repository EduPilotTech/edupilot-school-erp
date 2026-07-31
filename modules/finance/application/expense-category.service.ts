import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaExpenseCategoryRepository } from "../infrastructure/prisma-expense-category.repository";
import { ExpenseCategoryAlreadyExistsError, ExpenseCategoryNotFoundError } from "../domain/errors";
import { createExpenseCategorySchema, updateExpenseCategorySchema, type ExpenseCategoryDTO } from "./dto/finance-category.dto";
import type { ExpenseCategoryEntity } from "../domain/expense-category.entity";
import type { FinanceContext } from "./finance-context";

const repository = new PrismaExpenseCategoryRepository();

function toDTO(entity: ExpenseCategoryEntity): ExpenseCategoryDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createExpenseCategory(input: unknown, context: FinanceContext & { schoolId: string }): Promise<ExpenseCategoryDTO> {
  const parsed = createExpenseCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid expense category data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new ExpenseCategoryAlreadyExistsError();

  try {
    const category = await repository.create({ tenantId, schoolId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ExpenseCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateExpenseCategory(id: string, input: unknown, context: FinanceContext): Promise<ExpenseCategoryDTO> {
  const parsed = updateExpenseCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid expense category data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new ExpenseCategoryNotFoundError();

  try {
    const category = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ExpenseCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function softDeleteExpenseCategory(id: string, context: FinanceContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new ExpenseCategoryNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function getExpenseCategory(tenantId: string, id: string): Promise<ExpenseCategoryDTO> {
  const category = await repository.findById(tenantId, id);
  if (!category || category.deletedAt !== null) throw new ExpenseCategoryNotFoundError();
  return toDTO(category);
}

export async function listExpenseCategories(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<ExpenseCategoryDTO[]> {
  const categories = await repository.findMany(context.tenantId, filter);
  return categories.map(toDTO);
}

export { toDTO as toExpenseCategoryDTO };
