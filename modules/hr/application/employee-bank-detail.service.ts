import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeBankDetailRepository } from "../infrastructure/prisma-employee-bank-detail.repository";
import { EmployeeNotFoundError } from "../domain/errors";
import { upsertEmployeeBankDetailSchema, type EmployeeBankDetailDTO } from "./dto/employee-bank-detail.dto";
import type { EmployeeBankDetailEntity } from "../domain/employee-bank-detail.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: EmployeeBankDetailEntity): EmployeeBankDetailDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    accountHolderName: entity.accountHolderName,
    accountNumber: entity.accountNumber,
    bankName: entity.bankName,
    branchName: entity.branchName,
    ifscCode: entity.ifscCode,
    accountType: entity.accountType,
  };
}

// Upsert-style — EmployeeBankDetail is a 1:1 detail row, not a list: finds the existing row by
// employeeId and updates it if present, else creates a new one.
export async function createOrUpdateEmployeeBankDetail(input: unknown, context: HrContext): Promise<EmployeeBankDetailDTO> {
  const parsed = upsertEmployeeBankDetailSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid bank detail data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const employee = await employeeRepository.findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const repository = new PrismaEmployeeBankDetailRepository();
  const bankDetail = await repository.upsert({
    tenantId,
    employeeId: data.employeeId,
    accountHolderName: data.accountHolderName,
    accountNumber: data.accountNumber,
    bankName: data.bankName,
    branchName: data.branchName ?? null,
    ifscCode: data.ifscCode,
    accountType: data.accountType ?? null,
    updatedBy: actingUserId,
  });
  return toDTO(bankDetail);
}

export async function getEmployeeBankDetail(employeeId: string, context: { tenantId: string }): Promise<EmployeeBankDetailDTO | null> {
  const repository = new PrismaEmployeeBankDetailRepository();
  const bankDetail = await repository.findByEmployeeId(context.tenantId, employeeId);
  return bankDetail ? toDTO(bankDetail) : null;
}
