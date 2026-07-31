import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeSalaryAssignmentEntity } from "./employee-salary-assignment.entity";

export interface CreateEmployeeSalaryAssignmentInput {
  tenantId: string;
  employeeId: string;
  salaryStructureId: string;
  basicSalary: number;
  effectiveFrom: Date;
  createdBy?: string | null;
}

// Deliberately exposes only `create` and `close` — no generic `update` — mirroring
// StudentHostelAssignmentRepository's own "never overwrite historical data" discipline exactly. A
// salary revision closes the current row (`effectiveTo`) and, in the same transaction, a new
// `create` follows.
export interface EmployeeSalaryAssignmentRepository {
  // The row with `effectiveTo IS NULL` for this employee, if any — "current" is derived this way,
  // not stored as a separate flag that could drift out of sync.
  findCurrentForEmployee(tenantId: string, employeeId: string): Promise<EmployeeSalaryAssignmentEntity | null>;

  findHistoryForEmployee(tenantId: string, employeeId: string): Promise<EmployeeSalaryAssignmentEntity[]>;

  create(
    input: CreateEmployeeSalaryAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeSalaryAssignmentEntity>;

  // The one allowed mutation: sets `effectiveTo` on an existing row, closing it. Never touches
  // `salaryStructureId`/`basicSalary`.
  close(
    tenantId: string,
    id: string,
    effectiveTo: Date,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeSalaryAssignmentEntity>;
}
