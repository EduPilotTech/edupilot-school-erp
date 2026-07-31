import { ValidationError } from "@/lib/errors";
import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { getMyAttendance } from "@/modules/hr/application/employee-portal.service";

// GET /api/employee/v1/attendance?year=&month= — the Employee Portal's own monthly staff
// attendance view (mirrors app/api/parent/v1/students/[studentId]/attendance/route.ts's own
// query-param handling).
export async function GET(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    const year = Number(yearParam);
    const month = Number(monthParam);
    if (!yearParam || !monthParam || !Number.isInteger(year) || !Number.isInteger(month)) {
      throw new ValidationError("Valid `year` and `month` query parameters are required.");
    }

    const report = await getMyAttendance(context.tenantId, employeeId, year, month);

    return Response.json({ data: report });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
