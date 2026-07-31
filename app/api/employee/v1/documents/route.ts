import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { getMyDocuments } from "@/modules/hr/application/employee-portal.service";

// GET /api/employee/v1/documents — the Employee Portal's own document list, each with a freshly
// signed URL.
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "employee.portal.access");

    const employeeId = await resolveCurrentEmployeeId(context);
    const documents = await getMyDocuments(context.tenantId, employeeId);

    return Response.json({ data: documents });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
