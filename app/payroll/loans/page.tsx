import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { listEmployeeLoans } from "@/modules/payroll/application/employee-loan.service";
import { EmployeeLoanManager } from "@/components/features/payroll/EmployeeLoanManager";

interface LoansPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.loan.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const employeeId = first(params.employeeId) || undefined;

  const employeeResult = await listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId });
  const employeeOptions = employeeResult.items
    .filter((employee) => employee.isActive && employee.schoolId === authContext.schoolId)
    .map((employee) => ({ id: employee.id, fullName: employee.fullName, employeeCode: employee.employeeCode }));

  const loans = employeeId ? await listEmployeeLoans(authContext.tenantId, employeeId) : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
        ← Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Employee Loans & Advances</h1>
      <p className="mt-1 text-sm text-zinc-500">Issue loans and salary advances, and track recovery against payroll.</p>

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
          <EmployeeLoanManager employeeId={employeeId} items={loans} canManage />
        ) : (
          <p className="text-sm text-zinc-500">Select an employee to view or issue a loan/advance.</p>
        )}
      </div>
    </main>
  );
}
