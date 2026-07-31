import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getLeaveReport } from "@/modules/hr/application/get-leave-report.service";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { listLeaveTypes } from "@/modules/hr/application/leave-type.service";
import type { LeaveRequestStatusValue } from "@/modules/hr/domain/employee-leave-request.entity";

interface LeaveReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_OPTIONS: LeaveRequestStatusValue[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// Leave Report (Phase 13 spec §11.c). Note: LeaveReportRow (modules/hr/application/dto/hr-reports.dto.ts)
// does not carry an "approved by" field — only id/employeeCode/employeeName/leaveTypeName/
// fromDate/toDate/isHalfDay/totalDays/status/reason — so the table shows Reason in that column's
// place rather than inventing a field the backend read model doesn't provide.
export default async function HrLeaveReportPage({ searchParams }: LeaveReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hr.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const employeeId = first(params.employeeId) || undefined;
  const leaveTypeId = first(params.leaveTypeId) || undefined;
  const status = (first(params.status) || undefined) as LeaveRequestStatusValue | undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;

  const [rows, employeeResult, leaveTypes] = await Promise.all([
    getLeaveReport(authContext.tenantId, {
      employeeId,
      leaveTypeId,
      status,
      fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
      toDate: toDateRaw ? new Date(toDateRaw) : undefined,
    }),
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
    listLeaveTypes({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/hr/reports" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Leave Report</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every staff leave request, optionally filtered by employee, leave type, status, and date range.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="employeeId" className="text-xs font-medium text-zinc-500">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            defaultValue={employeeId ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All employees</option>
            {employeeResult.items.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="leaveTypeId" className="text-xs font-medium text-zinc-500">
            Leave Type
          </label>
          <select
            id="leaveTypeId"
            name="leaveTypeId"
            defaultValue={leaveTypeId ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All leave types</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType.id} value={leaveType.id}>
                {leaveType.name}
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
            defaultValue={status ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusLabel(statusOption)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fromDate" className="text-xs font-medium text-zinc-500">
            From
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            defaultValue={fromDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="toDate" className="text-xs font-medium text-zinc-500">
            To
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            defaultValue={toDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Leave Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">From</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">To</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Total Days</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  {row.employeeName} ({row.employeeCode})
                </td>
                <td className="px-4 py-2 text-zinc-700">{row.leaveTypeName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.fromDate}</td>
                <td className="px-4 py-2 text-zinc-700">{row.toDate}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.totalDays}</td>
                <td className="px-4 py-2 text-zinc-700">{statusLabel(row.status)}</td>
                <td className="px-4 py-2 text-zinc-700">{row.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No leave requests found.</p>}
      </div>
    </main>
  );
}
