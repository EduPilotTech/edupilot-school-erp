import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getDepartmentSummaryReport } from "@/modules/hr/application/get-department-summary-report.service";

// Department Summary Report (Phase 13 spec §11.f) — whole-school, no filter needed.
export default async function DepartmentSummaryReportPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.report.view");

  const rows = await getDepartmentSummaryReport(authContext.tenantId, authContext.schoolId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr/reports" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Department Summary Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Employee, active, and on-leave counts per department.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Department</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Employee Count</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Active Count</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">On Leave Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.departmentId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.departmentName}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.employeeCount}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.activeCount}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.onLeaveCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No departments found.</p>}
      </div>
    </main>
  );
}
