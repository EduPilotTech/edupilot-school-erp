"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/library/actions.ts, app/hr/actions.ts). Covers Phase 13's Payroll side: Salary
// Structure/Component CRUD, Employee Salary Assignment, Employee Loan/Advance create/cancel,
// Payroll Run create/process/lock + Payslip regeneration, and Salary Payment record/reverse.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import {
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
} from "@/modules/payroll/application/salary-structure.service";
import {
  addSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
} from "@/modules/payroll/application/salary-component.service";
import { assignSalary } from "@/modules/payroll/application/assign-salary.service";
import { createEmployeeLoan, cancelEmployeeLoan } from "@/modules/payroll/application/employee-loan.service";
import {
  createPayrollRun,
  processPayrollRun,
  lockPayrollRun,
  regeneratePayslip,
} from "@/modules/payroll/application/payroll-run.service";
import { recordSalaryPayment, reverseSalaryPayment } from "@/modules/payroll/application/salary-payment.service";
import { translatePayrollError, type ActionResult } from "./_lib/translate-payroll-error";
import type { SalaryStructureDTO, SalaryComponentDTO } from "@/modules/payroll/application/dto/salary-structure.dto";
import type { EmployeeSalaryAssignmentDTO } from "@/modules/payroll/application/dto/employee-salary-assignment.dto";
import type { EmployeeLoanDTO } from "@/modules/payroll/application/dto/employee-loan.dto";
import type { PayrollRunDTO, PayslipDTO, ProcessPayrollRunResultDTO } from "@/modules/payroll/application/dto/payroll-run.dto";
import type { SalaryPaymentDTO } from "@/modules/payroll/application/dto/salary-payment.dto";

// --- Salary Structure / Component ------------------------------------------------------------------

export async function createSalaryStructureAction(input: unknown): Promise<ActionResult<SalaryStructureDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    const structure = await createSalaryStructure(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: structure };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function updateSalaryStructureAction(id: string, input: unknown): Promise<ActionResult<SalaryStructureDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    const structure = await updateSalaryStructure(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: structure };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function deleteSalaryStructureAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    await deleteSalaryStructure(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function addSalaryComponentAction(input: unknown): Promise<ActionResult<SalaryComponentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    const component = await addSalaryComponent(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: component };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function updateSalaryComponentAction(id: string, input: unknown): Promise<ActionResult<SalaryComponentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    const component = await updateSalaryComponent(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: component };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function deleteSalaryComponentAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    await deleteSalaryComponent(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function assignSalaryAction(input: unknown): Promise<ActionResult<EmployeeSalaryAssignmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");
  try {
    const assignment = await assignSalary(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: assignment };
  } catch (error) {
    return translatePayrollError(error);
  }
}

// --- Employee Loan / Advance --------------------------------------------------------------------------

export async function createEmployeeLoanAction(input: unknown): Promise<ActionResult<EmployeeLoanDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.loan.manage");
  try {
    const loan = await createEmployeeLoan(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: loan };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function cancelEmployeeLoanAction(id: string): Promise<ActionResult<EmployeeLoanDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.loan.manage");
  try {
    const loan = await cancelEmployeeLoan(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: loan };
  } catch (error) {
    return translatePayrollError(error);
  }
}

// --- Payroll Run / Payslip -----------------------------------------------------------------------------

export async function createPayrollRunAction(input: unknown): Promise<ActionResult<PayrollRunDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");
  try {
    const run = await createPayrollRun(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: run };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function processPayrollRunAction(payrollRunId: string): Promise<ActionResult<ProcessPayrollRunResultDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");
  try {
    const result = await processPayrollRun(payrollRunId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: result };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function lockPayrollRunAction(payrollRunId: string): Promise<ActionResult<PayrollRunDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");
  try {
    const run = await lockPayrollRun(payrollRunId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: run };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function regeneratePayslipAction(payslipId: string): Promise<ActionResult<PayslipDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.run.manage");
  try {
    const payslip = await regeneratePayslip(payslipId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: payslip };
  } catch (error) {
    return translatePayrollError(error);
  }
}

// --- Salary Payment ----------------------------------------------------------------------------------

export async function recordSalaryPaymentAction(input: unknown): Promise<ActionResult<SalaryPaymentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.payment.manage");
  try {
    const payment = await recordSalaryPayment(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: payment };
  } catch (error) {
    return translatePayrollError(error);
  }
}

export async function reverseSalaryPaymentAction(input: unknown): Promise<ActionResult<SalaryPaymentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.payment.manage");
  try {
    const payment = await reverseSalaryPayment(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: payment };
  } catch (error) {
    return translatePayrollError(error);
  }
}
