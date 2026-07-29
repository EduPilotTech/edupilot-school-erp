import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { getParentDashboard } from "@/modules/parents/application/get-parent-dashboard.service";

// GET /api/parent/v1/dashboard?studentId=... — same getParentDashboard() service the web
// dashboard page calls (Decision 5: one application layer, two delivery mechanisms).
export async function GET(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.dashboard.view");

    const studentId = new URL(request.url).searchParams.get("studentId") ?? undefined;
    const dashboard = await getParentDashboard(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: dashboard });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
