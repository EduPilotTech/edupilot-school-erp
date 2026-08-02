import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getSubscriptionInvoice } from "@/modules/billing/application/generate-subscription-invoice.service";
import { listPaymentsForInvoice } from "@/modules/billing/application/payment.service";
import { SubscriptionInvoiceNotFoundError } from "@/modules/billing/domain/errors";
import { PLATFORM_INVOICES_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { InvoiceDetail } from "./_components/invoice-detail";

interface InvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
}

// Reuses the exact sanitization regex idiom as invoice-pdf.service.ts's own (unexported)
// sanitizeForStorageKey — that service writes the PDF to a fully deterministic key
// (`${tenantId}/invoices/${sanitizedInvoiceNumber}.pdf`), but SubscriptionInvoiceDTO does not
// expose `storageKey` (only the domain entity has that field — see the DTO's own toDTO mapping in
// generate-subscription-invoice.service.ts, which this bundle is not authorized to modify). Since
// the key is fully derivable from data already on the DTO (tenantId + invoiceNumber), this page
// reconstructs it locally and simply attempts to resolve a signed URL for it — Supabase's
// createSignedUrl errors if the object doesn't exist yet, which doubles as the "has a PDF been
// generated" check without needing the storageKey field at all.
function sanitizeForStorageKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

const PAYABLE_STATUSES = new Set(["ISSUED", "PARTIALLY_PAID", "OVERDUE"]);

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("billing.invoice.view");
  const authorization = await getAuthorizationContext();
  const canCancelInvoice = can(authorization, "platform.billing.manage");

  let invoice;
  try {
    invoice = await getSubscriptionInvoice(authContext.tenantId, invoiceId);
  } catch (error) {
    if (error instanceof SubscriptionInvoiceNotFoundError) notFound();
    throw error;
  }

  const payments = await listPaymentsForInvoice(authContext.tenantId, invoiceId);

  let pdfDownloadUrl: string | null = null;
  try {
    const storageKey = `${authContext.tenantId}/invoices/${sanitizeForStorageKey(invoice.invoiceNumber)}.pdf`;
    const storage = new SupabaseStorageService();
    pdfDownloadUrl = await storage.signedUrl(PLATFORM_INVOICES_BUCKET, storageKey, 3600);
  } catch {
    pdfDownloadUrl = null;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/billing/invoices" className="text-sm text-blue-600 hover:underline">
        ← Invoices
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Invoice {invoice.invoiceNumber}</h1>
      <p className="mt-1 text-sm text-zinc-500">{invoice.billingPeriod}</p>

      <div className="mt-6">
        <InvoiceDetail
          invoice={invoice}
          payments={payments}
          pdfDownloadUrl={pdfDownloadUrl}
          canPay={PAYABLE_STATUSES.has(invoice.status)}
          canCancelInvoice={canCancelInvoice && PAYABLE_STATUSES.has(invoice.status)}
        />
      </div>
    </main>
  );
}
