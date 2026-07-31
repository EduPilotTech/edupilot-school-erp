import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { PrismaSalaryStructureRepository } from "../infrastructure/prisma-salary-structure.repository";
import { PrismaEmployeeSalaryAssignmentRepository } from "../infrastructure/prisma-employee-salary-assignment.repository";
import { InvalidSalaryAssignmentError, SalaryStructureNotFoundError } from "../domain/errors";
import { recordPayrollAudit } from "./payroll-audit.helpers";
import { assignSalarySchema, type EmployeeSalaryAssignmentDTO } from "./dto/employee-salary-assignment.dto";
import type { EmployeeSalaryAssignmentEntity } from "../domain/employee-salary-assignment.entity";
import type { PayrollContext } from "./payroll-context";

function toDTO(entity: EmployeeSalaryAssignmentEntity): EmployeeSalaryAssignmentDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    salaryStructureId: entity.salaryStructureId,
    basicSalary: entity.basicSalary,
    effectiveFrom: entity.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: entity.effectiveTo ? entity.effectiveTo.toISOString().slice(0, 10) : null,
  };
}

// APPEND-ONLY revision: closes the current assignment (`effectiveTo` set to the new row's own
// `effectiveFrom` — a clean, non-overlapping boundary: the closed row covers
// [oldEffectiveFrom, newEffectiveFrom) and the new row starts exactly at newEffectiveFrom, so the
// two never overlap and there is no gap between them either) and opens a new one, in one
// transaction. Mirrors transferStudentHostel's own "close the old row, create the new one" shape.
export async function assignSalary(input: unknown, context: PayrollContext): Promise<EmployeeSalaryAssignmentDTO> {
  const parsed = assignSalarySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid salary assignment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const employee = await employeeRepository.findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const structureRepository = new PrismaSalaryStructureRepository();
  const structure = await structureRepository.findById(tenantId, data.salaryStructureId);
  if (!structure || structure.deletedAt !== null || !structure.isActive) {
    throw new SalaryStructureNotFoundError();
  }

  const assignmentRepository = new PrismaEmployeeSalaryAssignmentRepository();
  const current = await assignmentRepository.findCurrentForEmployee(tenantId, data.employeeId);
  if (current && current.effectiveFrom >= data.effectiveFrom) {
    throw new InvalidSalaryAssignmentError(
      "The new effective-from date must be after the current salary assignment's own effective-from date."
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    if (current) {
      await assignmentRepository.close(tenantId, current.id, data.effectiveFrom, actingUserId, tx);
    }

    const assignment = await assignmentRepository.create(
      {
        tenantId,
        employeeId: data.employeeId,
        salaryStructureId: data.salaryStructureId,
        basicSalary: data.basicSalary,
        effectiveFrom: data.effectiveFrom,
        createdBy: actingUserId,
      },
      tx
    );

    await recordPayrollAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "SALARY_ASSIGNED",
        entityType: "EmployeeSalaryAssignment",
        entityId: assignment.id,
        beforeState: current,
        afterState: assignment,
      },
      tx
    );

    return toDTO(assignment);
  });
}

export async function getCurrentSalaryAssignment(tenantId: string, employeeId: string): Promise<EmployeeSalaryAssignmentDTO | null> {
  const repository = new PrismaEmployeeSalaryAssignmentRepository();
  const assignment = await repository.findCurrentForEmployee(tenantId, employeeId);
  return assignment ? toDTO(assignment) : null;
}

// The full revision history for an employee, newest first — this IS the Increment History
// requirement (no separate model needed).
export async function getSalaryAssignmentHistory(tenantId: string, employeeId: string): Promise<EmployeeSalaryAssignmentDTO[]> {
  const repository = new PrismaEmployeeSalaryAssignmentRepository();
  const history = await repository.findHistoryForEmployee(tenantId, employeeId);
  return history.map(toDTO);
}

export { toDTO as toEmployeeSalaryAssignmentDTO };
