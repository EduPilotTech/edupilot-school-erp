import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface BillingHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

// Mirrors app/hostel/page.tsx's own LINKS hub pattern exactly. This is the tenant-facing
// counterpart to /platform/billing — a school's own view of ITS OWN subscription and billing,
// never another tenant's.
const LINKS: BillingHubLink[] = [
  { href: "/billing/subscription", label: "Current Plan", description: "Subscription status, expiry, renew, upgrade, and cancel", permission: "billing.subscription.manage" },
  { href: "/billing/invoices", label: "Invoices", description: "Billing history, invoice PDFs, and payment status", permission: "billing.invoice.view" },
  { href: "/billing/payments", label: "Payments", description: "Payment and refund history, receipt downloads", permission: "billing.invoice.view" },
];

export default async function BillingHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Billing & Subscription</h1>
      <p className="mt-1 text-sm text-zinc-500">Your school&apos;s subscription plan, invoices, and payment history.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
          >
            <h2 className="text-base font-semibold text-zinc-900">{link.label}</h2>
            <p className="mt-1 text-sm text-zinc-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
