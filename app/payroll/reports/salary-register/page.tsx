import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getSalaryRegister } from "@/modules/payroll/application/get-salary-register.service";

interface SalaryRegisterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function currentBillingPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Salary Register (Phase 13 spec §11.e) — department-grouped rows with a department subtotal and
// a grand total. getSalaryRegister returns an empty `departments` array (not an error) when no
// run exists yet for the period, per its own doc comment — rendered here as a plain message.
export default async function SalaryRegisterPage({ searchParams }: SalaryRegisterPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const billingPeriod = first(params.billingPeriod) || currentBillingPeriod();

  const register = await getSalaryRegister(authContext.tenantId, authContext.schoolId, billingPeriod);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll/reports" className="text-sm text-blue-600 hover:underline">
        ← Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Salary Register</h1>
      <p className="mt-1 text-sm text-zinc-500">Department-wise payroll for one billing period, with subtotals.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="billingPeriod" className="text-xs font-medium text-zinc-500">
            Billing Period
          </label>
          <input
            id="billingPeriod"
            name="billingPeriod"
            type="month"
            defaultValue={billingPeriod}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      {register.departments.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No payroll run found for this period.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {register.departments.map((department) => (
            <div key={department.departmentId} className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900">{department.departmentName}</div>
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee Code</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
                    <th className="px-4 py-2 text-right font-medium text-zinc-500">Gross</th>
                    <th className="px-4 py-2 text-right font-medium text-zinc-500">Deductions</th>
                    <th className="px-4 py-2 text-right font-medium text-zinc-500">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {department.employeeRows.map((row) => (
                    <tr key={row.employeeId}>
                      <td className="px-4 py-2 font-medium text-zinc-900">{row.employeeCode}</td>
                      <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                      <td className="px-4 py-2 text-right text-zinc-700">₹{row.grossEarnings.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-zinc-700">₹{row.totalDeductions.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{row.netPay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 bg-zinc-50">
                    <td colSpan={4} className="px-4 py-2 text-right text-sm font-medium text-zinc-700">
                      Department Subtotal
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-zinc-900">
                      ₹{department.departmentTotalNetPay.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
            <span className="text-sm font-medium text-zinc-500">Grand Total Net Pay</span>
            <span className="text-lg font-semibold text-zinc-900">₹{register.grandTotalNetPay.toFixed(2)}</span>
          </div>
        </div>
      )}
    </main>
  );
}
