import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyAttendance } from "@/modules/parents/application/get-my-attendance.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/attendance?startDate=&endDate= — Attendance View
// (requirement 6).
export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.attendance.view");

    const { studentId } = await params;
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") ?? undefined;
    const endDate = url.searchParams.get("endDate") ?? undefined;

    const report = await getMyAttendance(
      { studentId, startDate, endDate },
      { tenantId: context.tenantId, userProfileId: context.userId }
    );

    return Response.json({ data: report });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
