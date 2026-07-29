import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { markNotificationRead } from "@/modules/communication/application/mark-notification-read.service";

interface RouteParams {
  params: Promise<{ notificationId: string }>;
}

// POST /api/parent/v1/notifications/:notificationId/read — Push Notification Read Status
// (requirement 19).
export async function POST(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.notification.view");

    const { notificationId } = await params;
    const notification = await markNotificationRead(context.tenantId, notificationId, context.userId);

    return Response.json({ data: notification });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
