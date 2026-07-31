import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listSalaryPayments } from "@/modules/payroll/application/salary-payment.service";
import { listPayslips } from "@/modules/payroll/application/payroll-run.service";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { StatusBadge } from "@/components/features/payroll/StatusBadge";

interface SalaryPaymentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Read-only ledger of every SalaryPayment (optionally ?employeeId= filtered) — record/reverse
// happens on the owning payslip's own detail page (#6), not here. `listSalaryPayments` with no
// employeeId/payslipId filter returns every payment for the tenant
// (PrismaSalaryPaymentRepository.findMany passes `undefined` filters straight to Prisma, which
// ignores them) — safe to treat as "school-wide" since this codebase is one School per Tenant
// (see lib/auth/auth-context.ts's getCurrentSchool: `school.findUniqueOrThrow({ where: { tenantId
// } })`, i.e. exactly one School row per Tenant).
export default async function SalaryPaymentsPage({ searchParams }: SalaryPaymentsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.payment.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const employeeId = first(params.employeeId) || undefined;

  const [payments, payslips, employeeResult] = await Promise.all([
    listSalaryPayments(authContext.tenantId, { employeeId }),
    listPayslips(authContext.tenantId, {}),
    listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
  ]);

  const billingPeriodByPayslipId = new Map(payslips.map((payslip) => [payslip.id, payslip.billingPeriod]));
  const employeeNameById = new Map(
    employeeResult.items.map((employee) => [employee.id, `${employee.fullName} (${employee.employeeCode})`])
  );
  const employeeOptions = employeeResult.items.filter(
    (employee) => employee.isActive && employee.schoolId === authContext.schoolId
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/payroll" className="text-sm text-blue-600 hover:underline">
        ← Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Salary Payments</h1>
      <p className="mt-1 text-sm text-zinc-500">All salary disbursements. Open a payslip to record or reverse a payment.</p>

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
            <option value="">All employees</option>
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
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Billing Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Mode</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2 text-zinc-900">{employeeNameById.get(payment.employeeId) ?? payment.employeeId}</td>
                <td className="px-4 py-2 text-zinc-700">{billingPeriodByPayslipId.get(payment.payslipId) ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">₹{payment.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{payment.paymentMode}</td>
                <td className="px-4 py-2 text-zinc-700">{payment.paymentDate}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/payroll/payslips/${payment.payslipId}`} className="text-sm text-blue-600 hover:underline">
                    View Payslip
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="p-4 text-sm text-zinc-500">No salary payments recorded yet.</p>}
      </div>
    </main>
  );
}
