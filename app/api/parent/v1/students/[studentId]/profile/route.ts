import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyStudentProfile } from "@/modules/parents/application/get-my-student-profile.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/profile — Student Profile View (requirement 5).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.student.view");

    const { studentId } = await params;
    const profile = await getMyStudentProfile(
      { studentId },
      { tenantId: context.tenantId, userProfileId: context.userId }
    );

    return Response.json({ data: profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
