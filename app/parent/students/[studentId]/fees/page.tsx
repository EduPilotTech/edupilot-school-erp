import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyFeeSummary } from "@/modules/parents/application/get-my-fee-summary.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Fee Due Summary (requirement 9) — reuses listOutstandingInvoicesForStudent (Phase 8), which
// already applies the live fine computation.
export default async function ParentStudentFeesPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.fee.view");
  const { studentId } = await params;

  const invoices = await getMyFeeSummary(studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  const total = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Fee Due Summary</h1>
      <p className="mt-1 text-sm text-zinc-500">Total outstanding: ₹{total.toFixed(2)}</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Invoice #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Billing Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Due Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Balance</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-2 text-zinc-900">{invoice.invoiceNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.billingPeriod}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.dueDate}</td>
                <td className="px-4 py-2 text-zinc-700">₹{invoice.balance.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="p-4 text-sm text-zinc-500">No outstanding dues.</p>}
      </div>
    </main>
  );
}
