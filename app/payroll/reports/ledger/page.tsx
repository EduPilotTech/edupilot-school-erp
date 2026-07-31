import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { getEmployeeLedger } from "@/modules/payroll/application/payroll-ledger.helpers";

interface PayrollLedgerPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Payroll Ledger (Phase 13 spec §11 supplement) — an employee picker plus that employee's running
// balance, mirroring app/fees/reports/ledger/page.tsx's exact shape. Rendered in the same order
// getEmployeeLedger returns it: PrismaPayrollLedgerEntryRepository.findByEmployee orders by
// createdAt asc (oldest first) — the same chronological direction FeeLedgerEntry's own repository
// uses, per that file's own comment ("mirrors FeeLedgerEntry exactly").
export default async function PayrollLedgerPage({ searchParams }: PayrollLedgerPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const employeeId = first(params.employeeId) || "";

  const employeeResult = await listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId });
  const entries = employeeId ? await getEmployeeLedger(authContext.tenantId, employeeId) : [];
  const selectedEmployee = employeeResult.items.find((employee) => employee.id === employeeId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/payroll/reports" className="text-sm text-blue-600 hover:underline">
        ← Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payroll Ledger</h1>
      <p className="mt-1 text-sm text-zinc-500">Running balance of every payslip credit and payment debit, per employee.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="employeeId" className="text-xs font-medium text-zinc-500">
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            defaultValue={employeeId}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select an employee</option>
            {employeeResult.items.map((employee) => (
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
          Load
        </button>
      </form>

      {employeeId && (
        <div className="mt-8">
          {selectedEmployee && (
            <h2 className="text-base font-semibold text-zinc-900">
              {selectedEmployee.fullName} ({selectedEmployee.employeeCode})
            </h2>
          )}
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Reference</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Description</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Debit</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Credit</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-2 text-zinc-700">{entry.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-zinc-700">{entry.entryType}</td>
                    <td className="px-4 py-2 text-zinc-700">{entry.referenceType}</td>
                    <td className="px-4 py-2 text-zinc-700">{entry.description}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-700">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{entry.balanceAfter.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && <p className="p-4 text-sm text-zinc-500">No ledger entries yet.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
