import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getMyReceipt } from "@/modules/parents/application/get-my-receipt.service";

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

// GET /api/parent/v1/payments/:paymentId/receipt — Receipt Download (requirement 11). Returns
// the receipt DATA — the future mobile client renders/exports it locally, matching this phase's
// "offline-friendly DTOs" requirement rather than shipping a server-rendered file.
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.receipt.print");

    const { paymentId } = await params;
    const receipt = await getMyReceipt(paymentId, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: receipt });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
