import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getPaymentHistory, getRefundHistory } from "@/modules/billing/application/get-payment-history.service";
import type { PaymentDTO } from "@/modules/billing/application/dto/payment.dto";

interface PaymentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// A receipt only makes sense once money has actually moved — mirrors
// payment-receipt.service.ts's own RECEIPTABLE_STATUSES set exactly (CAPTURED,
// PARTIALLY_REFUNDED, REFUNDED); CREATED/AUTHORIZED/FAILED payments have no receipt link.
const RECEIPTABLE_STATUSES = new Set(["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"]);

const STATUS_BADGE_STYLES: Record<string, string> = {
  CREATED: "border-zinc-300 bg-zinc-100 text-zinc-600",
  AUTHORIZED: "border-blue-200 bg-blue-50 text-blue-700",
  CAPTURED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  REFUNDED: "border-amber-200 bg-amber-50 text-amber-700",
  PARTIALLY_REFUNDED: "border-amber-200 bg-amber-50 text-amber-700",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.CREATED}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PaymentsTable({ payments }: { payments: PaymentDTO[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Method</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            <th className="px-4 py-2 text-left font-medium text-zinc-500">Gateway Reference</th>
            <th className="px-4 py-2 text-right font-medium text-zinc-500">
              <span className="sr-only">Receipt</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-4 py-2 text-zinc-700">{payment.capturedAt ?? "—"}</td>
              <td className="px-4 py-2 text-zinc-900">
                {payment.currency} {payment.amount.toFixed(2)}
                {payment.refundedAmount > 0 && (
                  <span className="ml-2 text-xs text-amber-700">
                    (refunded {payment.currency} {payment.refundedAmount.toFixed(2)})
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-zinc-700">{payment.method ?? "—"}</td>
              <td className="px-4 py-2">
                <StatusPill status={payment.status} />
              </td>
              <td className="px-4 py-2 text-zinc-700">{payment.gatewayPaymentId ?? payment.gatewayOrderId}</td>
              <td className="px-4 py-2 text-right">
                {RECEIPTABLE_STATUSES.has(payment.status) && (
                  <a href={`/billing/payments/${payment.id}/receipt`} className="text-sm text-blue-600 hover:underline">
                    Receipt
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && <p className="p-4 text-sm text-zinc-500">No payments found.</p>}
    </div>
  );
}

// A plain server-rendered tab toggle (`?view=all|refunds`, two Links) — no client JS needed, same
// spirit as the invoices page's GET-form filter, just simpler since there are only two views.
// Receipt links are plain `<a href>` tags pointing at Step 1's route handler — the browser handles
// the PDF download natively.
export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("billing.invoice.view");
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const view = first(params.view) === "refunds" ? "refunds" : "all";

  const payments = view === "refunds" ? await getRefundHistory(authContext.tenantId) : await getPaymentHistory(authContext.tenantId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/billing" className="text-sm text-blue-600 hover:underline">
        ← Billing
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payments</h1>
      <p className="mt-1 text-sm text-zinc-500">Your school&apos;s payment and refund history.</p>

      <div className="mt-6 flex gap-2 text-sm">
        <Link
          href="/billing/payments"
          className={`rounded-lg px-3 py-1.5 font-medium ${view === "all" ? "bg-blue-600 text-white" : "border border-zinc-300 text-zinc-700 hover:border-zinc-400"}`}
        >
          All Payments
        </Link>
        <Link
          href="/billing/payments?view=refunds"
          className={`rounded-lg px-3 py-1.5 font-medium ${view === "refunds" ? "bg-blue-600 text-white" : "border border-zinc-300 text-zinc-700 hover:border-zinc-400"}`}
        >
          Refunds
        </Link>
      </div>

      <PaymentsTable payments={payments} />
    </main>
  );
}
