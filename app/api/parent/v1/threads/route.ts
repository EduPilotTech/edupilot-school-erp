import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { listMyThreads } from "@/modules/parents/application/list-my-threads.service";
import { sendMessageAsParent } from "@/modules/parents/application/send-message.service";

// GET /api/parent/v1/threads — Parent <-> Teacher Messaging (requirement 17), thread list.
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.message.view");

    const threads = await listMyThreads({ tenantId: context.tenantId, userProfileId: context.userId });
    return Response.json({ data: threads });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// POST /api/parent/v1/threads — sends a message, finding-or-creating the (student, guardian,
// teacher) thread. Body: { studentId, teacherId, body, subject? }.
export async function POST(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.message.send");

    const input = await request.json();
    const message = await sendMessageAsParent(input, {
      tenantId: context.tenantId,
      userProfileId: context.userId,
    });

    return Response.json({ data: message }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
