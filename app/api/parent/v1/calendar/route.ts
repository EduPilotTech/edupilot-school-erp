import { requireApiAuthContext, requireApiPermission, apiErrorResponse } from "../_lib/api-auth";
import { getSchoolCalendar } from "@/modules/communication/application/get-school-calendar.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";

// GET /api/parent/v1/calendar?academicSessionId=... — School Calendar (requirement 15),
// composed from Holiday + CalendarEvent (Decision 7). Defaults to the current session.
export async function GET(request: Request): Promise<Response> {
  try {
    const context = await requireApiAuthContext();
    requireApiPermission(context, "parent.calendar.view");

    const requestedSessionId = new URL(request.url).searchParams.get("academicSessionId");
    let academicSessionId = requestedSessionId;
    if (!academicSessionId) {
      const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
      academicSessionId = (sessions.find((session) => session.isCurrent) ?? sessions[0])?.id ?? null;
    }

    if (!academicSessionId) {
      return Response.json({ data: [] });
    }

    const calendar = await getSchoolCalendar(context.tenantId, academicSessionId);
    return Response.json({ data: calendar });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
