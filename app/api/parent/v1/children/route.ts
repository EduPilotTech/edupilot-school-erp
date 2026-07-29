import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { listMyChildren } from "@/modules/parents/application/list-my-children.service";

// GET /api/parent/v1/children — Multi-child Support (requirement 22).
export async function GET(): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.student.view");

    const children = await listMyChildren({ tenantId: context.tenantId, userProfileId: context.userId });
    return Response.json({ data: children });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
