import type { Prisma } from "@/lib/generated/prisma/client";
import type { FinanceAccountEntity, FinanceAccountTypeValue } from "./finance-account.entity";

export interface CreateFinanceAccountInput {
  tenantId: string;
  schoolId: string;
  name: string;
  accountType: FinanceAccountTypeValue;
  openingBalance: number;
  isDefault?: boolean;
  createdBy?: string | null;
}

export interface UpdateFinanceAccountInput {
  name?: string;
  accountType?: FinanceAccountTypeValue;
  isDefault?: boolean;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface FinanceAccountListFilter {
  isActive?: boolean;
  accountType?: FinanceAccountTypeValue;
}

export interface FinanceAccountRepository {
  findById(tenantId: string, id: string): Promise<FinanceAccountEntity | null>;
  // Case-insensitive match within one school — backs the "only one account of this name per
  // school" business rule (there is no DB-level unique index on `name`, so this check happens at
  // the application layer, same as e.g. FeeInvoice number-sequence uniqueness).
  findByName(tenantId: string, schoolId: string, name: string): Promise<FinanceAccountEntity | null>;
  findMany(tenantId: string, schoolId: string, filter?: FinanceAccountListFilter): Promise<FinanceAccountEntity[]>;
  create(input: CreateFinanceAccountInput, tx?: Prisma.TransactionClient): Promise<FinanceAccountEntity>;
  update(tenantId: string, id: string, input: UpdateFinanceAccountInput, tx?: Prisma.TransactionClient): Promise<FinanceAccountEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FinanceAccountEntity>;
  // Unsets `isDefault` on every OTHER active account for this school (optionally excluding one id
  // — used when re-saving the account that is itself already the default). Must run inside the
  // caller's transaction alongside the create/update that sets the new default, so exactly one
  // account is ever the default at a time.
  unsetDefaultForSchool(tenantId: string, schoolId: string, exceptId: string | undefined, tx: Prisma.TransactionClient): Promise<void>;
  // Atomically increments (positive delta) or decrements (negative delta) `currentBalance` via
  // Prisma's `{ increment }` operator — never read-then-write — so concurrent Income/Expense
  // postings to the same account never race. Must accept `tx` since it always runs inside the
  // caller's recordIncome/updateIncome/deleteIncome (or Expense equivalent) transaction.
  adjustBalance(tenantId: string, id: string, delta: number, tx: Prisma.TransactionClient): Promise<FinanceAccountEntity>;
}
