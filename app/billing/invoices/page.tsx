import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import {
  getInvoiceHistory,
  listOutstandingInvoices,
  listPaidInvoices,
  listEffectivelyOverdueInvoices,
} from "@/modules/billing/application/list-tenant-invoices.service";
import type { SubscriptionInvoiceDTO } from "@/modules/billing/application/dto/subscription-invoice.dto";

interface InvoicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
] as const;

const STATUS_BADGE_STYLES: Record<string, string> = {
  DRAFT: "border-zinc-300 bg-zinc-100 text-zinc-600",
  ISSUED: "border-blue-200 bg-blue-50 text-blue-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-700",
  OVERDUE: "border-red-200 bg-red-50 text-red-700",
  VOID: "border-zinc-300 bg-zinc-100 text-zinc-500",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.DRAFT}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// GET-form status filter, mirroring app/students/page.tsx's own filter-bar pattern — no client JS
// needed. `?status=all|outstanding|paid|overdue` picks which of list-tenant-invoices.service.ts's
// four read functions is called; "all" (the default) is getInvoiceHistory's full, unfiltered list.
export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("billing.invoice.view");
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const status = first(params.status) ?? "all";

  let invoices: SubscriptionInvoiceDTO[];
  switch (status) {
    case "outstanding":
      invoices = await listOutstandingInvoices(authContext.tenantId);
      break;
    case "paid":
      invoices = await listPaidInvoices(authContext.tenantId);
      break;
    case "overdue":
      invoices = await listEffectivelyOverdueInvoices(authContext.tenantId);
      break;
    default:
      invoices = await getInvoiceHistory(authContext.tenantId);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/billing" className="text-sm text-blue-600 hover:underline">
        ← Billing
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Invoices</h1>
      <p className="mt-1 text-sm text-zinc-500">Your school&apos;s subscription invoice history.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Invoice #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Billing Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Due Date</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{invoice.invoiceNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.billingPeriod}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {invoice.currency} {invoice.totalAmount.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <StatusPill status={invoice.status} />
                </td>
                <td className="px-4 py-2 text-zinc-700">{invoice.dueDate}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/billing/invoices/${invoice.id}`} className="text-sm text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="p-4 text-sm text-zinc-500">No invoices found.</p>}
      </div>
    </main>
  );
}
