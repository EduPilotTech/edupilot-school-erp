"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/hr/actions.ts, app/parent/actions.ts). This is the SELF-SERVICE counterpart to
// app/hr/actions.ts's applyForLeaveAction/cancelLeaveRequestAction: those are gated on
// "hr.leave.manage" (HR-manager-only) and trust a client-submitted `employeeId` because the
// caller is HR staff acting on someone else's behalf. Here the caller IS the employee, so
// `employeeId` is NEVER read from client input — it is always resolved server-side from the
// caller's own session via resolveCurrentEmployeeId(), then spliced into the service call,
// overwriting/discarding anything the client sent.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { applyForLeave } from "@/modules/hr/application/apply-for-leave.service";
import { cancelLeaveRequest } from "@/modules/hr/application/cancel-employee-leave.service";
import { listLeaveRequests } from "@/modules/hr/application/list-employee-leave-requests.service";
import { updateMyPersonalInfo } from "@/modules/hr/application/employee-portal.service";
import { LeaveRequestNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "./_lib/resolve-current-employee";
import { translateEmployeePortalError, type ActionResult } from "./_lib/translate-employee-portal-error";
import type { EmployeeLeaveRequestDTO } from "@/modules/hr/application/dto/leave.dto";
import type { EmployeeDTO } from "@/modules/hr/application/dto/employee.dto";

const PORTAL_PERMISSION = "employee.portal.access";

export async function applyForMyLeaveAction(input: unknown): Promise<ActionResult<EmployeeLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission(PORTAL_PERMISSION);

  try {
    // employeeId is resolved from the session, never trusted from `input` — even if the client
    // form/JS sends an `employeeId` field, it is overwritten here before reaching applyForLeave.
    const employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
    const rawInput = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const request = await applyForLeave(
      { ...rawInput, employeeId },
      { tenantId: authContext.tenantId, actingUserId: authContext.userId }
    );
    return { success: true, data: request };
  } catch (error) {
    return translateEmployeePortalError(error);
  }
}

export async function cancelMyLeaveRequestAction(leaveId: string): Promise<ActionResult<EmployeeLeaveRequestDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission(PORTAL_PERMISSION);

  try {
    // employeeId is resolved from the session, never from the client.
    const employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);

    // cancelLeaveRequest (modules/hr/application/cancel-employee-leave.service.ts) takes only a
    // `leaveId` — it has no employeeId parameter and performs no ownership check of its own
    // (by design: the app/hr admin-side caller is authorized to cancel ANY employee's leave, so
    // the service can't assume "caller == owner"). For self-service, ownership must be verified
    // HERE, before calling it, or any authenticated portal user could cancel another employee's
    // leave request by guessing/enumerating a leaveId. Fetching this employee's own leave
    // history and checking membership is the same defense-in-depth pattern
    // getMyPayslipDetail() already uses internally for payslips.
    const myRequests = await listLeaveRequests({ employeeId }, { tenantId: authContext.tenantId });
    const ownsRequest = myRequests.some((request) => request.id === leaveId);
    if (!ownsRequest) {
      // Same error a genuinely-missing leaveId would throw, so a caller can't distinguish
      // "doesn't exist" from "exists but isn't yours".
      throw new LeaveRequestNotFoundError();
    }

    const request = await cancelLeaveRequest(leaveId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: request };
  } catch (error) {
    return translateEmployeePortalError(error);
  }
}

export async function updateMyPersonalInfoAction(input: unknown): Promise<ActionResult<EmployeeDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission(PORTAL_PERMISSION);

  try {
    // employeeId is resolved from the session, never from the client.
    const employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
    const employee = await updateMyPersonalInfo(authContext.tenantId, employeeId, input, authContext.userId);
    return { success: true, data: employee };
  } catch (error) {
    return translateEmployeePortalError(error);
  }
}
