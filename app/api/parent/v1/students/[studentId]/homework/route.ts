import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyHomework } from "@/modules/parents/application/get-my-homework.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/homework — Homework (requirement 12, view-only).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.homework.view");

    const { studentId } = await params;
    const homework = await getMyHomework(studentId, { tenantId: context.tenantId, userProfileId: context.userId });

    return Response.json({ data: homework });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
