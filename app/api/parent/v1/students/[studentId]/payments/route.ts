import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyPayments } from "@/modules/parents/application/get-my-payments.service";

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

// GET /api/parent/v1/students/:studentId/payments — Payment History (requirement 10).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.payment.view");

    const { studentId } = await params;
    const payments = await getMyPayments(studentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: payments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
