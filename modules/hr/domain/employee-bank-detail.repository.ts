import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeBankDetailEntity } from "./employee-bank-detail.entity";

export interface UpsertEmployeeBankDetailInput {
  tenantId: string;
  employeeId: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName?: string | null;
  ifscCode: string;
  accountType?: string | null;
  updatedBy?: string | null;
}

export interface EmployeeBankDetailRepository {
  findByEmployeeId(tenantId: string, employeeId: string): Promise<EmployeeBankDetailEntity | null>;
  // Upsert-style — one row per Employee. `updatedBy` also fills `createdBy` on first insert.
  upsert(input: UpsertEmployeeBankDetailInput, tx?: Prisma.TransactionClient): Promise<EmployeeBankDetailEntity>;
}
