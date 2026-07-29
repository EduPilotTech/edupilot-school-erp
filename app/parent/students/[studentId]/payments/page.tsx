import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyPayments } from "@/modules/parents/application/get-my-payments.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
}

// Payment History (requirement 10) — reuses listStudentPayments (Phase 8) directly.
export default async function ParentStudentPaymentsPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.payment.view");
  const { studentId } = await params;

  const payments = await getMyPayments(studentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Payment History</h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Receipt #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Mode</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2 text-zinc-900">{payment.receiptNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(payment.paidAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-zinc-700">₹{payment.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{payment.paymentMode}</td>
                <td className="px-4 py-2 text-zinc-700">{payment.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/parent/payments/${payment.id}/receipt`} className="text-sm text-blue-600 hover:underline">
                    Download
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="p-4 text-sm text-zinc-500">No payments recorded yet.</p>}
      </div>
    </main>
  );
}
