import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface FeeHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: FeeHubLink[] = [
  { href: "/fees/categories", label: "Fee Categories", description: "Tuition, Transport, Hostel, Admission…", permission: "feecategory.view" },
  { href: "/fees/structures", label: "Fee Structures", description: "Class-wise amounts per fee category", permission: "feestructure.view" },
  { href: "/fees/fine-rules", label: "Fine Rules", description: "Late-payment fine policies", permission: "feestructure.view" },
  { href: "/fees/installment-plans", label: "Installment Plans", description: "Quarterly / half-yearly schedules", permission: "feestructure.view" },
  { href: "/fees/assignments", label: "Student Fee Assignment", description: "Assign a fee structure to a student", permission: "feeassignment.view" },
  { href: "/fees/billing", label: "Billing", description: "Generate monthly, one-time, and installment invoices", permission: "fee.invoice.view" },
  { href: "/fees/collect", label: "Collect Payment", description: "Cash collection and receipts", permission: "fee.payment.view" },
  { href: "/fees/concessions", label: "Concessions & Waivers", description: "Discounts, scholarships, waivers", permission: "fee.concession.view" },
  { href: "/fees/reports/ledger", label: "Student Fee Ledger", description: "Running balance per student", permission: "fee.ledger.view" },
  { href: "/fees/reports/daily-collection", label: "Daily Collection Report", description: "Today's receipts by mode", permission: "fee.report.daily.view" },
  { href: "/fees/reports/outstanding-due", label: "Outstanding Due Report", description: "Who owes what", permission: "fee.report.outstanding.view" },
  { href: "/fees/reports/class-collection", label: "Class-wise Collection Report", description: "Collected vs. outstanding by class", permission: "fee.report.classcollection.view" },
];

export default async function FeesHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Fee Management &amp; Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">Fee setup, invoicing, cash collection, concessions, and reports.</p>

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
