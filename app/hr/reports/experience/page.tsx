import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getExperienceReport } from "@/modules/hr/application/get-experience-report.service";

// Experience Report (Phase 13 spec §11.g) — whole-school, no filter needed.
export default async function ExperienceReportPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.report.view");

  const rows = await getExperienceReport(authContext.tenantId, authContext.schoolId);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/hr/reports" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Experience Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Prior experience and tenure at this school, per employee.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Department</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Designation</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Joining Date</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Experience Years</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Tenure Years</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.employeeCode}</td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.departmentName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{row.designationName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(row.joiningDate).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.experienceYears ?? "—"}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.tenureYears}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No employees found.</p>}
      </div>
    </main>
  );
}
