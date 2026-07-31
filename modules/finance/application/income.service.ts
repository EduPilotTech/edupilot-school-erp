import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaIncomeRepository } from "../infrastructure/prisma-income.repository";
import { PrismaIncomeCategoryRepository } from "../infrastructure/prisma-income-category.repository";
import { PrismaFinanceAccountRepository } from "../infrastructure/prisma-finance-account.repository";
import { FinanceAccountNotFoundError, IncomeCategoryNotFoundError, IncomeNotFoundError, InvalidFinanceOperationError } from "../domain/errors";
import { computeDeleteDelta, computeRecordDelta, computeUpdateDelta, INCOME_DIRECTION } from "./balance-delta.helpers";
import {
  createIncomeSchema,
  updateIncomeSchema,
  type IncomeDTO,
  type IncomeListFilterInput,
  type IncomeListResultDTO,
} from "./dto/income.dto";
import type { IncomeEntity } from "../domain/income.entity";
import type { FinanceContext } from "./finance-context";

const incomeRepository = new PrismaIncomeRepository();
const incomeCategoryRepository = new PrismaIncomeCategoryRepository();
const financeAccountRepository = new PrismaFinanceAccountRepository();
const academicSessionRepository = new PrismaAcademicSessionRepository();

function toDTO(entity: IncomeEntity): IncomeDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    academicSessionId: entity.academicSessionId,
    incomeCategoryId: entity.incomeCategoryId,
    financeAccountId: entity.financeAccountId,
    amount: entity.amount,
    date: entity.date.toISOString().slice(0, 10),
    description: entity.description,
    referenceNo: entity.referenceNo,
    collectedBy: entity.collectedBy,
  };
}

// Records a new Income entry AND, in the same transaction, credits the referenced
// FinanceAccount.currentBalance by the full amount (see balance-delta.helpers.ts) — the one piece
// of real business logic in this service, mirroring how modules/payroll composes a Payslip write
// with an EmployeeLoan balance adjustment inside one transaction.
export async function recordIncome(input: unknown, context: FinanceContext): Promise<IncomeDTO> {
  const parsed = createIncomeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid income data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const category = await incomeCategoryRepository.findById(tenantId, data.incomeCategoryId);
  if (!category || category.deletedAt !== null || !category.isActive) {
    throw new IncomeCategoryNotFoundError();
  }

  const account = await financeAccountRepository.findById(tenantId, data.financeAccountId);
  if (!account || account.deletedAt !== null || !account.isActive) {
    throw new FinanceAccountNotFoundError();
  }

  if (category.schoolId !== account.schoolId) {
    throw new InvalidFinanceOperationError("The income category and finance account must belong to the same school.");
  }

  const session = await academicSessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidFinanceOperationError("The referenced academic session does not exist.");
  }

  const income = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const created = await incomeRepository.create(
      {
        tenantId,
        schoolId: account.schoolId,
        academicSessionId: data.academicSessionId,
        incomeCategoryId: data.incomeCategoryId,
        financeAccountId: data.financeAccountId,
        amount: data.amount,
        date: data.date,
        description: data.description ?? null,
        referenceNo: data.referenceNo ?? null,
        collectedBy: data.collectedBy ?? null,
        createdBy: actingUserId,
      },
      tx
    );

    const deltas = computeRecordDelta(INCOME_DIRECTION, data.amount, data.financeAccountId);
    for (const line of deltas) {
      await financeAccountRepository.adjustBalance(tenantId, line.accountId, line.delta, tx);
    }

    return created;
  });

  return toDTO(income);
}

// If `amount` and/or `financeAccountId` change, reverses the OLD amount from the OLD account and
// applies the NEW amount to the NEW (possibly same) account, in one transaction — see
// computeUpdateDelta's own comment for exactly how the two net together.
export async function updateIncome(id: string, input: unknown, context: FinanceContext): Promise<IncomeDTO> {
  const parsed = updateIncomeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid income data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await incomeRepository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new IncomeNotFoundError();

  if (data.incomeCategoryId && data.incomeCategoryId !== existing.incomeCategoryId) {
    const category = await incomeCategoryRepository.findById(tenantId, data.incomeCategoryId);
    if (!category || category.deletedAt !== null || !category.isActive) {
      throw new IncomeCategoryNotFoundError();
    }
    if (category.schoolId !== existing.schoolId) {
      throw new InvalidFinanceOperationError("The new income category must belong to the same school as this income entry.");
    }
  }

  if (data.financeAccountId && data.financeAccountId !== existing.financeAccountId) {
    const account = await financeAccountRepository.findById(tenantId, data.financeAccountId);
    if (!account || account.deletedAt !== null || !account.isActive) {
      throw new FinanceAccountNotFoundError();
    }
    if (account.schoolId !== existing.schoolId) {
      throw new InvalidFinanceOperationError("The new finance account must belong to the same school as this income entry.");
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
  const deltas = computeUpdateDelta(INCOME_DIRECTION, existing.amount, existing.financeAccountId, newAmount, newFinanceAccountId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const result = await incomeRepository.update(
      tenantId,
      id,
      {
        academicSessionId: data.academicSessionId,
        incomeCategoryId: data.incomeCategoryId,
        financeAccountId: data.financeAccountId,
        amount: data.amount,
        date: data.date,
        description: data.description,
        referenceNo: data.referenceNo,
        collectedBy: data.collectedBy,
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

// Soft-deletes the entry AND reverses its amount from its FinanceAccount's currentBalance, in one
// transaction — the exact inverse of recordIncome.
export async function deleteIncome(id: string, context: FinanceContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const existing = await incomeRepository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new IncomeNotFoundError();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    await incomeRepository.softDelete(tenantId, id, actingUserId, tx);

    const deltas = computeDeleteDelta(INCOME_DIRECTION, existing.amount, existing.financeAccountId);
    for (const line of deltas) {
      await financeAccountRepository.adjustBalance(tenantId, line.accountId, line.delta, tx);
    }
  });
}

export async function listIncome(tenantId: string, filter: IncomeListFilterInput): Promise<IncomeListResultDTO> {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;

  const result = await incomeRepository.findMany(tenantId, {
    page,
    pageSize,
    academicSessionId: filter.academicSessionId,
    incomeCategoryId: filter.incomeCategoryId,
    financeAccountId: filter.financeAccountId,
    fromDate: filter.fromDate,
    toDate: filter.toDate,
    search: filter.search,
  });

  return { items: result.items.map(toDTO), total: result.total, page: result.page, pageSize: result.pageSize };
}

export async function getIncome(tenantId: string, id: string): Promise<IncomeDTO> {
  const income = await incomeRepository.findById(tenantId, id);
  if (!income || income.deletedAt !== null) throw new IncomeNotFoundError();
  return toDTO(income);
}

export { toDTO as toIncomeDTO };
