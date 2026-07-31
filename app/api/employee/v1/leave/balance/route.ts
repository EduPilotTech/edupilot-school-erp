import { ValidationError } from "@/lib/errors";
import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../../_lib/resolve-current-employee";
import { getMyLeaveBalance } from "@/modules/hr/application/employee-portal.service";

// GET /api/employee/v1/leave/balance?year= — the Employee Portal's own leave balance view.
export async function GET(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);

    const yearParam = new URL(request.url).searchParams.get("year");
    const year = Number(yearParam);
    if (!yearParam || !Number.isInteger(year)) {
      throw new ValidationError("A valid `year` query parameter is required.");
    }

    const balances = await getMyLeaveBalance(context.tenantId, employeeId, year);

    return Response.json({ data: balances });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
