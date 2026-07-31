import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { getMyLeaveHistory } from "@/modules/hr/application/employee-portal.service";
import { applyForLeave } from "@/modules/hr/application/apply-for-leave.service";

// GET /api/employee/v1/leave — the Employee Portal's own leave request history.
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const history = await getMyLeaveHistory(context.tenantId, employeeId);

    return Response.json({ data: history });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// POST /api/employee/v1/leave — apply for leave, always against the caller's OWN employeeId.
// `employeeId` is never read from the request body, even if present there — it is always
// overwritten with the server-resolved id, per the "own records only" security requirement.
export async function POST(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const body = await request.json();
    const input = typeof body === "object" && body !== null ? { ...body, employeeId } : { employeeId };

    const leaveRequest = await applyForLeave(input, { tenantId: context.tenantId, actingUserId: context.userId });

    return Response.json({ data: leaveRequest }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
