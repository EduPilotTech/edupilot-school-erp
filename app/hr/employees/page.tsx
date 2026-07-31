import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getEmployeeListReport } from "@/modules/hr/application/get-employee-list-report.service";
import { listDepartments } from "@/modules/hr/application/department.service";
import { PaginationLinks } from "./_components/pagination-links";
import type { EmploymentStatusValue } from "@/modules/hr/domain/employee.entity";

interface EmployeesListPageProps {
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

const PAGE_SIZE = 20;

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Server Component. getEmployeeListReport (Phase 13 spec §11.a) already gives the joined shape a
// list needs — employee code + full name + department/designation/employment type names — in
// one call, so it is preferred here over listEmployees (which would require a second per-row
// getUserDetail lookup for the name and doesn't join department/designation/employment type
// names at all). The report service has no `search`/pagination parameters of its own (it composes
// existing reads for a whole-school report, not a paginated list endpoint) — search and
// pagination are therefore applied here, in the page, over the already-filtered (department/
// status) report rows. This mirrors app/students/page.tsx's filter-bar shape exactly.
export default async function EmployeesListPage({ searchParams }: EmployeesListPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hr.employee.manage");
  const params = await searchParams;

  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const departmentId = first(params.departmentId) || undefined;
  const employmentStatus = (first(params.employmentStatus) || undefined) as EmploymentStatusValue | undefined;
  const search = first(params.search)?.trim().toLowerCase() || undefined;
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [allRows, departments] = await Promise.all([
    getEmployeeListReport(authContext.tenantId, authContext.schoolId, { departmentId, employmentStatus }),
    listDepartments({ tenantId: authContext.tenantId }),
  ]);

  const filteredRows = search
    ? allRows.filter(
        (row) => row.fullName.toLowerCase().includes(search) || row.employeeCode.toLowerCase().includes(search)
      )
    : allRows;

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/hr" className="text-sm text-blue-600 hover:underline">
            ← HR & Payroll
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Employees</h1>
        </div>
        <Link
          href="/hr/employees/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add Employee
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="search" className="text-xs font-medium text-zinc-500">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={first(params.search) ?? ""}
            placeholder="Employee code or name"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="departmentId" className="text-xs font-medium text-zinc-500">
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={first(params.departmentId) ?? ""}
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
            defaultValue={first(params.employmentStatus) ?? ""}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((row) => (
              <tr key={row.employeeId}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  <Link href={`/hr/employees/${row.employeeId}`} className="text-blue-600 hover:underline">
                    {row.employeeCode}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.departmentName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{row.designationName || "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{statusLabel(row.employmentStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No employees found.</p>}
      </div>

      <PaginationLinks page={currentPage} totalPages={totalPages} searchParams={params} />
    </main>
  );
}
