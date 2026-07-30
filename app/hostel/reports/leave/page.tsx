import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getHostelLeaveReport } from "@/modules/hostel/application/get-hostel-leave-report.service";
import type { HostelLeaveStatusValue } from "@/modules/hostel/domain/hostel-leave-request.entity";

interface LeaveReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HostelLeaveReportPage({ searchParams }: LeaveReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const statusFilter = first(params.status) as HostelLeaveStatusValue | "" | undefined;

  const rows = await getHostelLeaveReport(authContext.tenantId, statusFilter || undefined);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Leave Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every hostel leave request, optionally filtered by status.</p>

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
            <option value="">All statuses</option>
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

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">From</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">To</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Returned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.studentName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.leaveType}</td>
                <td className="px-4 py-2 text-zinc-700">{row.fromDate}</td>
                <td className="px-4 py-2 text-zinc-700">{row.toDate}</td>
                <td className="px-4 py-2 text-zinc-700">{row.status}</td>
                <td className="px-4 py-2 text-zinc-700">{row.actualReturnDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No leave requests found.</p>}
      </div>
    </main>
  );
}
