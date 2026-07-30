import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyHostel } from "@/modules/parents/application/get-my-hostel.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/hostel — Parent Portal Integration (Phase 11): room,
// bed, today's attendance, and leave status.
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.hostel.view");

    const { studentId } = await params;
    const hostel = await getMyHostel(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: hostel });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
