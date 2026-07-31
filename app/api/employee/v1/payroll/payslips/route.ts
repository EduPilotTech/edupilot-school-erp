import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../../_lib/resolve-current-employee";
import { getMyPayslips } from "@/modules/hr/application/employee-portal.service";

// GET /api/employee/v1/payroll/payslips — the Employee Portal's own salary history.
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const payslips = await getMyPayslips(context.tenantId, employeeId);

    return Response.json({ data: payslips });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
