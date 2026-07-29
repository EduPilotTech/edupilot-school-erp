import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyTransport } from "@/modules/parents/application/get-my-transport.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/transport — Parent Portal Integration (Phase 10
// Decision 10 / requirement 11): route, stop, vehicle, driver, and today's boarding status.
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.transport.view");

    const { studentId } = await params;
    const transport = await getMyTransport(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: transport });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
