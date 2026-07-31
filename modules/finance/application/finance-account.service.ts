import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaFinanceAccountRepository } from "../infrastructure/prisma-finance-account.repository";
import { FinanceAccountAlreadyExistsError, FinanceAccountNotFoundError } from "../domain/errors";
import {
  createFinanceAccountSchema,
  updateFinanceAccountSchema,
  type FinanceAccountDTO,
} from "./dto/finance-account.dto";
import type { FinanceAccountEntity, FinanceAccountTypeValue } from "../domain/finance-account.entity";
import type { FinanceContext } from "./finance-context";

const repository = new PrismaFinanceAccountRepository();

function toDTO(entity: FinanceAccountEntity): FinanceAccountDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    accountType: entity.accountType,
    openingBalance: entity.openingBalance,
    currentBalance: entity.currentBalance,
    isDefault: entity.isDefault,
    isActive: entity.isActive,
  };
}

// `openingBalance` seeds `currentBalance` on create (see PrismaFinanceAccountRepository.create) —
// from then on `currentBalance` is only ever moved by Income/Expense's own services. When
// `isDefault: true`, every other account at this school is unset first, in the same transaction,
// so exactly one account is ever the school's default at a time.
export async function createFinanceAccount(
  input: unknown,
  context: FinanceContext & { schoolId: string }
): Promise<FinanceAccountDTO> {
  const parsed = createFinanceAccountSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid finance account data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const existing = await repository.findByName(tenantId, schoolId, data.name);
  if (existing) throw new FinanceAccountAlreadyExistsError();

  try {
    const account = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      if (data.isDefault) {
        await repository.unsetDefaultForSchool(tenantId, schoolId, undefined, tx);
      }

      return repository.create(
        {
          tenantId,
          schoolId,
          name: data.name,
          accountType: data.accountType,
          openingBalance: data.openingBalance,
          isDefault: data.isDefault,
          createdBy: actingUserId,
        },
        tx
      );
    });
    return toDTO(account);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FinanceAccountAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateFinanceAccount(id: string, input: unknown, context: FinanceContext): Promise<FinanceAccountDTO> {
  const parsed = updateFinanceAccountSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid finance account data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new FinanceAccountNotFoundError();

  if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await repository.findByName(tenantId, existing.schoolId, data.name);
    if (duplicate && duplicate.id !== id) throw new FinanceAccountAlreadyExistsError();
  }

  try {
    if (data.isDefault) {
      const account = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
        await repository.unsetDefaultForSchool(tenantId, existing.schoolId, id, tx);
        return repository.update(tenantId, id, { ...data, updatedBy: actingUserId }, tx);
      });
      return toDTO(account);
    }

    const account = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(account);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FinanceAccountAlreadyExistsError();
    }
    throw error;
  }
}

// A straightforward soft delete — no "balance must be zero" guard. A school may legitimately
// close an account that still carries a stray balance (e.g. migrating to a new bank account);
// inventing that guard was explicitly out of scope for this phase.
export async function softDeleteFinanceAccount(id: string, context: FinanceContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new FinanceAccountNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listFinanceAccounts(
  tenantId: string,
  schoolId: string,
  filter?: { isActive?: boolean; accountType?: FinanceAccountTypeValue }
): Promise<FinanceAccountDTO[]> {
  const accounts = await repository.findMany(tenantId, schoolId, filter);
  return accounts.map(toDTO);
}

export async function getFinanceAccount(tenantId: string, id: string): Promise<FinanceAccountDTO> {
  const account = await repository.findById(tenantId, id);
  if (!account || account.deletedAt !== null) throw new FinanceAccountNotFoundError();
  return toDTO(account);
}

export { toDTO as toFinanceAccountDTO };
