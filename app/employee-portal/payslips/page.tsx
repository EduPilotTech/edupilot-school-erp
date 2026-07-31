import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyPayslips } from "@/modules/hr/application/employee-portal.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";
import { StatusBadge } from "@/components/features/payroll/StatusBadge";

// My Payslips — list only, read-only, no payment actions (those are admin-only in
// app/payroll/**). Each row links to the detail page for the full earnings/deductions breakdown.
export default async function EmployeePortalPayslipsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">My Payslips</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  const payslips = await getMyPayslips(authContext.tenantId, employeeId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/employee-portal" className="text-sm text-blue-600 hover:underline">
        ← Employee Portal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">My Payslips</h1>
      <p className="mt-1 text-sm text-zinc-500">Your salary history, one payslip per billing period.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Billing Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Gross Earnings</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Deductions</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Net Pay</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {payslips.map((payslip) => (
              <tr key={payslip.id}>
                <td className="px-4 py-2 text-zinc-900">{payslip.billingPeriod}</td>
                <td className="px-4 py-2 text-zinc-700">₹{payslip.grossEarnings.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">₹{payslip.totalDeductions.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-900">₹{payslip.netPay.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={payslip.status} />
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/employee-portal/payslips/${payslip.id}`} className="text-sm text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payslips.length === 0 && <p className="p-4 text-sm text-zinc-500">No payslips yet.</p>}
      </div>
    </main>
  );
}
