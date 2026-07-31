"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/library/actions.ts, app/hostel/actions.ts). Covers Phase 13's HR side: Department/
// Designation/EmploymentType master data, Employee CRUD, Employee Bank Detail, Employee Document
// upload/list/delete + letter generation, Leave Type CRUD, Leave Balance allocate/get, Leave
// Request apply/approve/reject/cancel/list, and Performance Review create/list.

import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import {
  createDepartment,
  updateDepartment,
  softDeleteDepartment,
} from "@/modules/hr/application/department.service";
import {
  createDesignation,
  updateDesignation,
  softDeleteDesignation,
} from "@/modules/hr/application/designation.service";
import {
  createEmploymentType,
  updateEmploymentType,
  softDeleteEmploymentType,
} from "@/modules/hr/application/employment-type.service";
import { createEmployee, updateEmployee, listEmployees } from "@/modules/hr/application/employee.service";
import { getEmployeeProfile } from "@/modules/hr/application/get-employee-profile.service";
import { createOrUpdateEmployeeBankDetail } from "@/modules/hr/application/employee-bank-detail.service";
import { uploadEmployeeDocument } from "@/modules/hr/application/upload-employee-document.service";
import { listEmployeeDocuments } from "@/modules/hr/application/list-employee-documents.service";
import { deleteEmployeeDocument } from "@/modules/hr/application/delete-employee-document.service";
import { generateEmployeeLetter } from "@/modules/hr/application/generate-employee-letter.service";
import { createLeaveType, updateLeaveType, softDeleteLeaveType } from "@/modules/hr/application/leave-type.service";
import { allocateLeaveBalance, getLeaveBalances } from "@/modules/hr/application/employee-leave-balance.service";
import { applyForLeave } from "@/modules/hr/application/apply-for-leave.service";
import { approveLeaveRequest, rejectLeaveRequest } from "@/modules/hr/application/decide-employee-leave.service";
import { cancelLeaveRequest } from "@/modules/hr/application/cancel-employee-leave.service";
import { listLeaveRequests } from "@/modules/hr/application/list-employee-leave-requests.service";
import { createPerformanceReview, listPerformanceReviews } from "@/modules/hr/application/performance-review.service";
import { translateHrError, type ActionResult } from "./_lib/translate-hr-error";
import type { DepartmentDTO, DesignationDTO, EmploymentTypeDTO } from "@/modules/hr/application/dto/hr-master.dto";
import type { EmployeeDTO, EmployeeListResultDTO, EmployeeProfileDTO } from "@/modules/hr/application/dto/employee.dto";
import type { EmployeeBankDetailDTO } from "@/modules/hr/application/dto/employee-bank-detail.dto";
import type {
  EmployeeDocumentDTO,
  EmployeeDocumentListItemDTO,
  DeleteEmployeeDocumentResult,
  UploadableEmployeeDocumentType,
} from "@/modules/hr/application/dto/employee-document.dto";
import type { LeaveTypeDTO, EmployeeLeaveBalanceDTO, EmployeeLeaveRequestDTO } from "@/modules/hr/application/dto/leave.dto";
import type { PerformanceReviewDTO } from "@/modules/hr/application/dto/performance-review.dto";

// --- Department / Designation / EmploymentType (HR Master Data) --------------------------------

export async function createDepartmentAction(input: unknown): Promise<ActionResult<DepartmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    const department = await createDepartment(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: department };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function updateDepartmentAction(id: string, input: unknown): Promise<ActionResult<DepartmentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    const department = await updateDepartment(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: department };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    await softDeleteDepartment(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function createDesignationAction(input: unknown): Promise<ActionResult<DesignationDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    const designation = await createDesignation(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: designation };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function updateDesignationAction(id: string, input: unknown): Promise<ActionResult<DesignationDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    const designation = await updateDesignation(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: designation };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function deleteDesignationAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    await softDeleteDesignation(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function createEmploymentTypeAction(input: unknown): Promise<ActionResult<EmploymentTypeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    const employmentType = await createEmploymentType(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: employmentType };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function updateEmploymentTypeAction(id: string, input: unknown): Promise<ActionResult<EmploymentTypeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    const employmentType = await updateEmploymentType(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: employmentType };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function deleteEmploymentTypeAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.master.manage");
  try {
    await softDeleteEmploymentType(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Employee ------------------------------------------------------------------------------------

export async function createEmployeeAction(input: unknown): Promise<ActionResult<EmployeeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const employee = await createEmployee(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: employee };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function updateEmployeeAction(employeeId: string, input: unknown): Promise<ActionResult<EmployeeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const employee = await updateEmployee(employeeId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: employee };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function listEmployeesAction(input: unknown): Promise<ActionResult<EmployeeListResultDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const result = await listEmployees(input, { tenantId: authContext.tenantId });
    return { success: true, data: result };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function getEmployeeProfileAction(employeeId: string): Promise<ActionResult<EmployeeProfileDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const profile = await getEmployeeProfile(employeeId, { tenantId: authContext.tenantId });
    return { success: true, data: profile };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Employee Bank Detail -------------------------------------------------------------------------

export async function upsertEmployeeBankDetailAction(input: unknown): Promise<ActionResult<EmployeeBankDetailDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const bankDetail = await createOrUpdateEmployeeBankDetail(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: bankDetail };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Employee Document -----------------------------------------------------------------------------

export interface UploadEmployeeDocumentActionInput {
  employeeId: string;
  documentType: UploadableEmployeeDocumentType;
  file: File;
}

export async function uploadEmployeeDocumentAction(
  input: UploadEmployeeDocumentActionInput
): Promise<ActionResult<EmployeeDocumentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const document = await uploadEmployeeDocument(
      {
        employeeId: input.employeeId,
        documentType: input.documentType,
        originalFileName: input.file.name,
        mimeType: input.file.type,
        fileSize: input.file.size,
        file: input.file,
      },
      { tenantId: authContext.tenantId, actingUserId: authContext.userId }
    );
    return { success: true, data: document };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function listEmployeeDocumentsAction(employeeId: string): Promise<ActionResult<EmployeeDocumentListItemDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const documents = await listEmployeeDocuments({ employeeId }, { tenantId: authContext.tenantId });
    return { success: true, data: documents };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function deleteEmployeeDocumentAction(documentId: string): Promise<ActionResult<DeleteEmployeeDocumentResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const result = await deleteEmployeeDocument({ documentId }, { tenantId: authContext.tenantId });
    return { success: true, data: result };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function generateEmployeeLetterAction(input: unknown): Promise<ActionResult<EmployeeDocumentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  try {
    const school = await getCurrentSchool();
    const document = await generateEmployeeLetter(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
      school: {
        name: school.schoolName,
        address: `${school.address}, ${school.city}, ${school.state} ${school.postalCode}`,
      },
    });
    return { success: true, data: document };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Leave Type (HR Master Data) --------------------------------------------------------------------

export async function createLeaveTypeAction(input: unknown): Promise<ActionResult<LeaveTypeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const leaveType = await createLeaveType(input, {
      tenantId: authContext.tenantId,
      schoolId: authContext.schoolId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: leaveType };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function updateLeaveTypeAction(id: string, input: unknown): Promise<ActionResult<LeaveTypeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const leaveType = await updateLeaveType(id, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: leaveType };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function deleteLeaveTypeAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    await softDeleteLeaveType(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Leave Balance ---------------------------------------------------------------------------------

export async function allocateLeaveBalanceAction(input: unknown): Promise<ActionResult<EmployeeLeaveBalanceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const balance = await allocateLeaveBalance(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: balance };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function getLeaveBalanceAction(input: unknown): Promise<ActionResult<EmployeeLeaveBalanceDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const balances = await getLeaveBalances(input, { tenantId: authContext.tenantId });
    return { success: true, data: balances };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Leave Request -----------------------------------------------------------------------------------

export async function applyForLeaveAction(input: unknown): Promise<ActionResult<EmployeeLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const request = await applyForLeave(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: request };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function approveLeaveRequestAction(leaveId: string): Promise<ActionResult<EmployeeLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const request = await approveLeaveRequest(leaveId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: request };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function rejectLeaveRequestAction(leaveId: string, input: unknown): Promise<ActionResult<EmployeeLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const request = await rejectLeaveRequest(leaveId, input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: request };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function cancelLeaveRequestAction(leaveId: string): Promise<ActionResult<EmployeeLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const request = await cancelLeaveRequest(leaveId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: request };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function listLeaveRequestsAction(input: unknown): Promise<ActionResult<EmployeeLeaveRequestDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");
  try {
    const requests = await listLeaveRequests(input, { tenantId: authContext.tenantId });
    return { success: true, data: requests };
  } catch (error) {
    return translateHrError(error);
  }
}

// --- Performance Review ------------------------------------------------------------------------------

export async function createPerformanceReviewAction(input: unknown): Promise<ActionResult<PerformanceReviewDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.performance.manage");
  try {
    const review = await createPerformanceReview(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: review };
  } catch (error) {
    return translateHrError(error);
  }
}

export async function listPerformanceReviewsAction(employeeId: string): Promise<ActionResult<PerformanceReviewDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("hr.performance.manage");
  try {
    const reviews = await listPerformanceReviews(authContext.tenantId, employeeId);
    return { success: true, data: reviews };
  } catch (error) {
    return translateHrError(error);
  }
}
