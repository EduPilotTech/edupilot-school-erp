import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { NotFoundError } from "@/lib/errors";
import { listPayrollRuns } from "@/modules/payroll/application/payroll-run.service";
import { getPayrollReport } from "@/modules/payroll/application/get-payroll-report.service";
import type { PayrollReportDTO } from "@/modules/payroll/application/dto/payroll-reports.dto";

interface PayrollReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Payroll Report (Phase 13 spec §11.d). This page IS the report picker directly — a PayrollRun
// dropdown (listPayrollRuns) plus the selected run's totals + per-employee payslip breakdown
// (getPayrollReport). Salary Register, Payroll Ledger, and Payroll Audit Log are separate sibling
// pages under /payroll/reports, reachable from the main /hr/reports hub.
export default async function PayrollReportPage({ searchParams }: PayrollReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const runs = await listPayrollRuns(authContext.tenantId, authContext.schoolId);
  const sortedRuns = [...runs].sort((a, b) => (a.billingPeriod < b.billingPeriod ? 1 : -1));
  const payrollRunId = first(params.payrollRunId) || sortedRuns[0]?.id || "";

  let report: PayrollReportDTO | null = null;
  if (payrollRunId) {
    try {
      report = await getPayrollReport(authContext.tenantId, payrollRunId);
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
        ← Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payroll Report</h1>
      <p className="mt-1 text-sm text-zinc-500">One payroll run&apos;s totals and per-employee payslip breakdown.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="payrollRunId" className="text-xs font-medium text-zinc-500">
            Payroll Run
          </label>
          <select
            id="payrollRunId"
            name="payrollRunId"
            defaultValue={payrollRunId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sortedRuns.map((run) => (
              <option key={run.id} value={run.id}>
                {run.billingPeriod} — {run.status}
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

      {report ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{report.status}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500">Gross</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">₹{report.totalGross.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500">Deductions</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">₹{report.totalDeductions.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500">Net Pay</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">₹{report.totalNetPay.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee Code</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Gross</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Deductions</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Loan Recovery</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Net Pay</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Payslip Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {report.rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className="px-4 py-2 font-medium text-zinc-900">{row.employeeCode}</td>
                    <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">₹{row.grossEarnings.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">₹{row.totalDeductions.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-zinc-700">₹{row.loanRecoveryAmount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{row.netPay.toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-700">{row.payslipStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No payslips for this run.</p>}
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          {sortedRuns.length === 0 ? "No payroll runs found for this school." : "Select a payroll run to view its report."}
        </p>
      )}
    </main>
  );
}
