import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyProgressReport } from "@/modules/parents/application/get-my-progress-report.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/results — Examination Results (requirement 7).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.result.view");

    const { studentId } = await params;
    const report = await getMyProgressReport(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: report });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
