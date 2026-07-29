import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { listMyNotifications } from "@/modules/communication/application/list-notifications.service";

// GET /api/parent/v1/notifications — Push Notification Read Status (requirement 19) surface;
// each item carries `readAt` and `priority` (requirement 10) directly.
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.notification.view");

    const notifications = await listMyNotifications(context.tenantId, context.userId);
    return Response.json({ data: notifications });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
