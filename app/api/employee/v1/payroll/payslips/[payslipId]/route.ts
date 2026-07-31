import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../../../_lib/resolve-current-employee";
import { getMyPayslipDetail } from "@/modules/hr/application/employee-portal.service";

interface RouteParams {
  params: Promise<{ payslipId: string }>;
}

// GET /api/employee/v1/payroll/payslips/:payslipId — a single payslip's full detail (with
// components). Ownership is verified inside getMyPayslipDetail itself: a payslip that exists but
// belongs to a different employee throws the same PayslipNotFoundError a genuinely missing one
// would, so this route can't be used to enumerate another employee's payslips by guessing ids.
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const { payslipId } = await params;
    const payslip = await getMyPayslipDetail(context.tenantId, employeeId, payslipId);

    return Response.json({ data: payslip });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
