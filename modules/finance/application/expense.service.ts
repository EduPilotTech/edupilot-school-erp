import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaExpenseRepository } from "../infrastructure/prisma-expense.repository";
import { PrismaExpenseCategoryRepository } from "../infrastructure/prisma-expense-category.repository";
import { PrismaFinanceAccountRepository } from "../infrastructure/prisma-finance-account.repository";
import { ExpenseCategoryNotFoundError, ExpenseNotFoundError, FinanceAccountNotFoundError, InvalidFinanceOperationError } from "../domain/errors";
import { computeDeleteDelta, computeRecordDelta, computeUpdateDelta, EXPENSE_DIRECTION } from "./balance-delta.helpers";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type ExpenseDTO,
  type ExpenseListFilterInput,
  type ExpenseListResultDTO,
} from "./dto/expense.dto";
import type { ExpenseEntity } from "../domain/expense.entity";
import type { FinanceContext } from "./finance-context";

const expenseRepository = new PrismaExpenseRepository();
const expenseCategoryRepository = new PrismaExpenseCategoryRepository();
const financeAccountRepository = new PrismaFinanceAccountRepository();
const academicSessionRepository = new PrismaAcademicSessionRepository();

function toDTO(entity: ExpenseEntity): ExpenseDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    academicSessionId: entity.academicSessionId,
    expenseCategoryId: entity.expenseCategoryId,
    financeAccountId: entity.financeAccountId,
    amount: entity.amount,
    date: entity.date.toISOString().slice(0, 10),
    vendor: entity.vendor,
    description: entity.description,
    paymentMode: entity.paymentMode,
    referenceNo: entity.referenceNo,
  };
}

// The symmetric counterpart of recordIncome: records a new Expense entry AND, in the same
// transaction, debits the referenced FinanceAccount.currentBalance by the full amount.
export async function recordExpense(input: unknown, context: FinanceContext): Promise<ExpenseDTO> {
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid expense data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const category = await expenseCategoryRepository.findById(tenantId, data.expenseCategoryId);
  if (!category || category.deletedAt !== null || !category.isActive) {
    throw new ExpenseCategoryNotFoundError();
  }

  const account = await financeAccountRepository.findById(tenantId, data.financeAccountId);
  if (!account || account.deletedAt !== null || !account.isActive) {
    throw new FinanceAccountNotFoundError();
  }

  if (category.schoolId !== account.schoolId) {
    throw new InvalidFinanceOperationError("The expense category and finance account must belong to the same school.");
  }

  const session = await academicSessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidFinanceOperationError("The referenced academic session does not exist.");
  }

  const expense = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const created = await expenseRepository.create(
      {
        tenantId,
        schoolId: account.schoolId,
        academicSessionId: data.academicSessionId,
        expenseCategoryId: data.expenseCategoryId,
        financeAccountId: data.financeAccountId,
        amount: data.amount,
        date: data.date,
        vendor: data.vendor ?? null,
        description: data.description ?? null,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo ?? null,
        createdBy: actingUserId,
      },
      tx
    );

    const deltas = computeRecordDelta(EXPENSE_DIRECTION, data.amount, data.financeAccountId);
    for (const line of deltas) {
      await financeAccountRepository.adjustBalance(tenantId, line.accountId, line.delta, tx);
    }

    return created;
  });

  return toDTO(expense);
}

// The symmetric counterpart of updateIncome — see computeUpdateDelta's own comment for exactly
// how an amount/account change nets into the FinanceAccount balance adjustment.
export async function updateExpense(id: string, input: unknown, context: FinanceContext): Promise<ExpenseDTO> {
  const parsed = updateExpenseSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid expense data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await expenseRepository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new ExpenseNotFoundError();

  if (data.expenseCategoryId && data.expenseCategoryId !== existing.expenseCategoryId) {
    const category = await expenseCategoryRepository.findById(tenantId, data.expenseCategoryId);
    if (!category || category.deletedAt !== null || !category.isActive) {
      throw new ExpenseCategoryNotFoundError();
    }
    if (category.schoolId !== existing.schoolId) {
      throw new InvalidFinanceOperationError("The new expense category must belong to the same school as this expense entry.");
    }
  }

  if (data.financeAccountId && data.financeAccountId !== existing.financeAccountId) {
    const account = await financeAccountRepository.findById(tenantId, data.financeAccountId);
    if (!account || account.deletedAt !== null || !account.isActive) {
      throw new FinanceAccountNotFoundError();
    }
    if (account.schoolId !== existing.schoolId) {
      throw new InvalidFinanceOperationError("The new finance account must belong to the same school as this expense entry.");
    }
  }

  if (data.academicSessionId && data.academicSessionId !== existing.academicSessionId) {
    const session = await academicSessionRepository.findById(tenantId, data.academicSessionId);
    if (!session || session.deletedAt !== null) {
      throw new InvalidFinanceOperationError("The referenced academic session does not exist.");
    }
  }

  const newAmount = data.amount ?? existing.amount;
  const newFinanceAccountId = data.financeAccountId ?? existing.financeAccountId;
  const deltas = computeUpdateDelta(EXPENSE_DIRECTION, existing.amount, existing.financeAccountId, newAmount, newFinanceAccountId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const result = await expenseRepository.update(
      tenantId,
      id,
      {
        academicSessionId: data.academicSessionId,
        expenseCategoryId: data.expenseCategoryId,
        financeAccountId: data.financeAccountId,
        amount: data.amount,
        date: data.date,
        vendor: data.vendor,
        description: data.description,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo,
        updatedBy: actingUserId,
      },
      tx
    );

    for (const line of deltas) {
      await financeAccountRepository.adjustBalance(tenantId, line.accountId, line.delta, tx);
    }

    return result;
  });

  return toDTO(updated);
}

// Soft-deletes the entry AND reverses its amount back onto its FinanceAccount's currentBalance,
// in one transaction — the exact inverse of recordExpense.
export async function deleteExpense(id: string, context: FinanceContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const existing = await expenseRepository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new ExpenseNotFoundError();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    await expenseRepository.softDelete(tenantId, id, actingUserId, tx);

    const deltas = computeDeleteDelta(EXPENSE_DIRECTION, existing.amount, existing.financeAccountId);
    for (const line of deltas) {
      await financeAccountRepository.adjustBalance(tenantId, line.accountId, line.delta, tx);
    }
  });
}

export async function listExpense(tenantId: string, filter: ExpenseListFilterInput): Promise<ExpenseListResultDTO> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;

  const result = await expenseRepository.findMany(tenantId, {
    page,
    pageSize,
    academicSessionId: filter.academicSessionId,
    expenseCategoryId: filter.expenseCategoryId,
    financeAccountId: filter.financeAccountId,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
    search: filter.search,
  });

  return { items: result.items.map(toDTO), total: result.total, page: result.page, pageSize: result.pageSize };
}

export async function getExpense(tenantId: string, id: string): Promise<ExpenseDTO> {
  const expense = await expenseRepository.findById(tenantId, id);
  if (!expense || expense.deletedAt !== null) throw new ExpenseNotFoundError();
  return toDTO(expense);
}

export { toDTO as toExpenseDTO };
