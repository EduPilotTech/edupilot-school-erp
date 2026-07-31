import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { listLeaveTypes } from "@/modules/hr/application/leave-type.service";
import { listLeaveRequests } from "@/modules/hr/application/list-employee-leave-requests.service";
import { LeaveRequestManager } from "@/components/features/hr/LeaveRequestManager";

interface LeaveRequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const LEAVE_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
type LeaveStatusFilter = (typeof LEAVE_STATUS_VALUES)[number];

function isLeaveStatusFilter(value: string | undefined): value is LeaveStatusFilter {
  return LEAVE_STATUS_VALUES.includes(value as LeaveStatusFilter);
}

// HR-manager approval console for staff leave requests, plus a small "Allocate Leave Balance"
// panel — there is no other page yet for allocating balances (Phase 13 spec has no dedicated
// balance-management screen), so it lives here alongside the requests it feeds. Staff-initiated
// "apply for leave" is a separate, Employee Portal-only flow built by a different agent — this
// page never calls applyForLeaveAction.
export default async function LeaveRequestsPage({ searchParams }: LeaveRequestsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hr.leave.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const statusParam = first(params.status);
  const statusFilter = isLeaveStatusFilter(statusParam) ? statusParam : undefined;

  const [employeeResult, leaveTypes, leaveRequests] = await Promise.all([
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
    listLeaveTypes({ tenantId: authContext.tenantId }, { isActive: true }),
    listLeaveRequests({ status: statusFilter }, { tenantId: authContext.tenantId }),
  ]);

  const employeeOptions = employeeResult.items
    .filter((employee) => employee.isActive)
    .map((employee) => ({ id: employee.id, fullName: employee.fullName, employeeCode: employee.employeeCode }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Leave Requests</h1>
      <p className="mt-1 text-sm text-zinc-500">Approve, reject, and track staff leave, and allocate yearly leave balances.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
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
        <LeaveRequestManager
          items={leaveRequests}
          employeeOptions={employeeOptions}
          leaveTypeOptions={leaveTypes.map((leaveType) => ({ id: leaveType.id, name: leaveType.name }))}
          canManage
        />
      </div>
    </main>
  );
}
