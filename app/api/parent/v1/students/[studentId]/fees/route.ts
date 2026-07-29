import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyFeeSummary } from "@/modules/parents/application/get-my-fee-summary.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/fees — Fee Due Summary (requirement 9).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.fee.view");

    const { studentId } = await params;
    const invoices = await getMyFeeSummary(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: invoices });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
