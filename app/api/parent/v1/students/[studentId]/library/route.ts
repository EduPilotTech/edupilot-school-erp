import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyLibrary } from "@/modules/parents/application/get-my-library.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/library — Parent Portal Integration (Phase 12
// requirement 8): issued books, history, due date, fine, overdue, reservation status.
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.library.view");

    const { studentId } = await params;
    const library = await getMyLibrary(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: library });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
