import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { getMyProfile, updateMyPersonalInfo } from "@/modules/hr/application/employee-portal.service";

// GET /api/employee/v1/profile — the Employee Portal's own Employee Profile view (mirrors
// app/api/parent/v1/dashboard/route.ts's structure: same requireApiAuthContext ->
// requireApiPermission -> resolve "my" id -> call service -> Response.json shape).
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const profile = await getMyProfile(context.tenantId, employeeId);

    return Response.json({ data: profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// PATCH /api/employee/v1/profile — restricted self-service update (qualification/emergency
// contact fields only — see updateMyPersonalInfoSchema's own comment for why department/
// designation/employmentType/salary stay unreachable through this route).
export async function PATCH(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const body: unknown = await request.json();
    const profile = await updateMyPersonalInfo(context.tenantId, employeeId, body, context.userId);

    return Response.json({ data: profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
