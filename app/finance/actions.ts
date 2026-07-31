"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/hr/actions.ts, app/payroll/actions.ts). Covers Phase 14's Finance & Accounts:
// Finance Account CRUD, Income/Expense Category CRUD, and Income/Expense record CRUD. Reports and
// the Dashboard are pure reads with no Server Actions — called directly from Server Component
// pages per this codebase's established convention.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import {
  createFinanceAccount,
  updateFinanceAccount,
  softDeleteFinanceAccount,
} from "@/modules/finance/application/finance-account.service";
import {
  createIncomeCategory,
  updateIncomeCategory,
  softDeleteIncomeCategory,
} from "@/modules/finance/application/income-category.service";
import {
  createExpenseCategory,
  updateExpenseCategory,
  softDeleteExpenseCategory,
} from "@/modules/finance/application/expense-category.service";
import { recordIncome, updateIncome, deleteIncome } from "@/modules/finance/application/income.service";
import { recordExpense, updateExpense, deleteExpense } from "@/modules/finance/application/expense.service";
import { translateFinanceError, type ActionResult } from "./_lib/translate-finance-error";
import type { FinanceAccountDTO } from "@/modules/finance/application/dto/finance-account.dto";
import type { IncomeCategoryDTO, ExpenseCategoryDTO } from "@/modules/finance/application/dto/finance-category.dto";
import type { IncomeDTO } from "@/modules/finance/application/dto/income.dto";
import type { ExpenseDTO } from "@/modules/finance/application/dto/expense.dto";

// --- Finance Account -------------------------------------------------------------------------

export async function createFinanceAccountAction(input: unknown): Promise<ActionResult<FinanceAccountDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    const account = await createFinanceAccount(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
      schoolId: authContext.schoolId,
    });
    return { success: true, data: account };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function updateFinanceAccountAction(id: string, input: unknown): Promise<ActionResult<FinanceAccountDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    const account = await updateFinanceAccount(id, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: account };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function deleteFinanceAccountAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    await softDeleteFinanceAccount(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFinanceError(error);
  }
}

// --- Income Category -------------------------------------------------------------------------

export async function createIncomeCategoryAction(input: unknown): Promise<ActionResult<IncomeCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    const category = await createIncomeCategory(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
      schoolId: authContext.schoolId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function updateIncomeCategoryAction(id: string, input: unknown): Promise<ActionResult<IncomeCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    const category = await updateIncomeCategory(id, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function deleteIncomeCategoryAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    await softDeleteIncomeCategory(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFinanceError(error);
  }
}

// --- Expense Category -------------------------------------------------------------------------

export async function createExpenseCategoryAction(input: unknown): Promise<ActionResult<ExpenseCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    const category = await createExpenseCategory(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
      schoolId: authContext.schoolId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function updateExpenseCategoryAction(id: string, input: unknown): Promise<ActionResult<ExpenseCategoryDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    const category = await updateExpenseCategory(id, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: category };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function deleteExpenseCategoryAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");
  try {
    await softDeleteExpenseCategory(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFinanceError(error);
  }
}

// --- Income -----------------------------------------------------------------------------------

export async function recordIncomeAction(input: unknown): Promise<ActionResult<IncomeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.income.manage");
  try {
    const income = await recordIncome(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: income };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function updateIncomeAction(id: string, input: unknown): Promise<ActionResult<IncomeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.income.manage");
  try {
    const income = await updateIncome(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: income };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function deleteIncomeAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.income.manage");
  try {
    await deleteIncome(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFinanceError(error);
  }
}

// --- Expense ----------------------------------------------------------------------------------

export async function recordExpenseAction(input: unknown): Promise<ActionResult<ExpenseDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.expense.manage");
  try {
    const expense = await recordExpense(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: expense };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function updateExpenseAction(id: string, input: unknown): Promise<ActionResult<ExpenseDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.expense.manage");
  try {
    const expense = await updateExpense(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: expense };
  } catch (error) {
    return translateFinanceError(error);
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("finance.expense.manage");
  try {
    await deleteExpense(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFinanceError(error);
  }
}
