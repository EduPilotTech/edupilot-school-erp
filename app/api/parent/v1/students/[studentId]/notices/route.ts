import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyNotices } from "@/modules/parents/application/get-my-notices.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/notices — Notice Board (requirement 14).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.notice.view");

    const { studentId } = await params;
    const notices = await getMyNotices(studentId, { tenantId: context.tenantId, userProfileId: context.userId });

    return Response.json({ data: notices });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
