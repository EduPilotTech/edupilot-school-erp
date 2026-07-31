import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { listSalaryStructures } from "@/modules/payroll/application/salary-structure.service";
import { getCurrentSalaryAssignment, getSalaryAssignmentHistory } from "@/modules/payroll/application/assign-salary.service";
import { SalaryAssignmentManager } from "@/components/features/payroll/SalaryAssignmentManager";

interface SalaryAssignmentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Employee-picker-then-detail shape mirrors app/hr/performance/page.tsx exactly: an
// `?employeeId=` GET filter form drives which employee's assignment/history is shown.
// listEmployees is capped at pageSize 100 by its own zod schema (no way around that without
// reaching into modules/hr's infrastructure layer, which this task must not modify) — acceptable
// at typical school staff-roster sizes, same tradeoff app/hr/performance/page.tsx already made.
export default async function SalaryAssignmentsPage({ searchParams }: SalaryAssignmentsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.structure.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const employeeId = first(params.employeeId) || undefined;

  const [employeeResult, structures] = await Promise.all([
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
    listSalaryStructures(authContext.tenantId, authContext.schoolId),
  ]);

  const employeeOptions = employeeResult.items
    .filter((employee) => employee.isActive && employee.schoolId === authContext.schoolId)
    .map((employee) => ({ id: employee.id, fullName: employee.fullName, employeeCode: employee.employeeCode }));

  const [currentAssignment, history] = employeeId
    ? await Promise.all([
        getCurrentSalaryAssignment(authContext.tenantId, employeeId),
        getSalaryAssignmentHistory(authContext.tenantId, employeeId),
      ])
    : [null, []];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
        ← Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Employee Salary Assignment</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Assign a salary structure and basic salary to an employee, and review their increment history.
      </p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="employeeId" className="text-xs font-medium text-zinc-500">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            defaultValue={employeeId ?? ""}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select an employee…</option>
            {employeeOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          View
        </button>
      </form>

      <div className="mt-6">
        {employeeId ? (
          <SalaryAssignmentManager
            employeeId={employeeId}
            structures={structures}
            currentAssignment={currentAssignment}
            history={history}
            canManage
          />
        ) : (
          <p className="text-sm text-zinc-500">Select an employee to view or assign their salary.</p>
        )}
      </div>
    </main>
  );
}
