import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getEmployeeListReport } from "@/modules/hr/application/get-employee-list-report.service";
import { listDepartments } from "@/modules/hr/application/department.service";
import type { EmploymentStatusValue } from "@/modules/hr/domain/employee.entity";

interface EmployeeListReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_OPTIONS: EmploymentStatusValue[] = [
  "ACTIVE",
  "ON_PROBATION",
  "ON_LEAVE",
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
];

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Employee List Report (Phase 13 spec §11.a). Server Component, GET-form filters — mirrors
// app/hostel/reports/room-occupancy/page.tsx's exact "filter form + table" shape.
export default async function EmployeeListReportPage({ searchParams }: EmployeeListReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hr.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const departmentId = first(params.departmentId) || undefined;
  const employmentStatus = (first(params.employmentStatus) || undefined) as EmploymentStatusValue | undefined;

  const [rows, departments] = await Promise.all([
    getEmployeeListReport(authContext.tenantId, authContext.schoolId, { departmentId, employmentStatus }),
    listDepartments({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/hr/reports" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Employee List Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every employee at this school, optionally filtered by department and status.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="departmentId" className="text-xs font-medium text-zinc-500">
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={departmentId ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="employmentStatus" className="text-xs font-medium text-zinc-500">
            Employment Status
          </label>
          <select
            id="employmentStatus"
            name="employmentStatus"
            defaultValue={employmentStatus ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Department</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Designation</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employment Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Joining Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.employeeCode}</td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.departmentName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{row.designationName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{row.employmentTypeName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{statusLabel(row.employmentStatus)}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(row.joiningDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No employees found.</p>}
      </div>
    </main>
  );
}
