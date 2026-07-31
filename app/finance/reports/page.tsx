import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";

interface FinanceReportHubLink {
  href: string;
  label: string;
  description: string;
}

// Mirrors app/hr/reports/page.tsx's hub pattern — every Finance report is gated by the same
// `finance.report.view` permission (checked once here), so this hub is a plain list rather than a
// per-link permission filter.
const LINKS: FinanceReportHubLink[] = [
  {
    href: "/finance/reports/income",
    label: "Income Report",
    description: "Every income entry, filterable by academic session and date range",
  },
  {
    href: "/finance/reports/expense",
    label: "Expense Report",
    description: "Every expense entry, filterable by academic session and date range",
  },
  {
    href: "/finance/reports/category-wise-income",
    label: "Category-wise Income Report",
    description: "Income totals grouped by income category, with entry counts",
  },
  {
    href: "/finance/reports/category-wise-expense",
    label: "Category-wise Expense Report",
    description: "Expense totals grouped by expense category, with entry counts",
  },
  {
    href: "/finance/reports/monthly-summary",
    label: "Monthly Summary Report",
    description: "Income, expense, and net totals for each of the 12 months of a chosen year",
  },
];

export default async function FinanceReportsHubPage() {
  await requireAuthContext();
  await requirePermission("finance.report.view");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Finance Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">Income, expense, category-wise, and monthly summary reports.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((link) => (
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
