import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listHostelResidentStudents } from "@/modules/hostel/application/list-hostel-resident-students.service";
import { listHostelLeaveRequestsByStatus } from "@/modules/hostel/application/list-hostel-leave-requests.service";
import { HostelLeaveManager } from "@/components/features/hostel/HostelLeaveManager";
import type { HostelLeaveStatusValue } from "@/modules/hostel/domain/hostel-leave-request.entity";

interface LeavePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HostelLeavePage({ searchParams }: LeavePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.leave.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";
  const statusFilter = (first(params.status) as HostelLeaveStatusValue | undefined) ?? "PENDING";

  const [studentOptions, leaveRequests] = await Promise.all([
    listHostelResidentStudents(authContext.tenantId, academicSessionId),
    listHostelLeaveRequestsByStatus(authContext.tenantId, statusFilter),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Leave Management</h1>
      <p className="mt-1 text-sm text-zinc-500">Request, approve, reject, and track return for hostel leave.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6">
        <HostelLeaveManager
          academicSessionId={academicSessionId}
          items={leaveRequests}
          studentOptions={studentOptions}
          canManage
        />
      </div>
    </main>
  );
}
