import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../../../_lib/api-auth";
import { getThreadMessages } from "@/modules/communication/application/get-thread-messages.service";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

// GET /api/parent/v1/threads/:threadId/messages — also marks every message sent TO this reader
// as read (same behavior as the web thread view).
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.message.view");

    const { threadId } = await params;
    const thread = await getThreadMessages(context.tenantId, threadId, context.userId);

    return Response.json({ data: thread });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
