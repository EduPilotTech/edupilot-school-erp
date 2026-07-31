import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface FinanceHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

// Mirrors app/hr/page.tsx's and app/payroll/page.tsx's hub pattern exactly — a permission-filtered
// grid of links. Phase 14: a simple cash/bank ledger (Admission Fee, Tuition Fee, Salary, Electric
// Bill, ...) — not double-entry accounting.
const LINKS: FinanceHubLink[] = [
  {
    href: "/finance/accounts",
    label: "Finance Accounts",
    description: "The cash/bank ledger accounts money is recorded against",
    permission: "finance.master.manage",
  },
  {
    href: "/finance/income-categories",
    label: "Income Categories",
    description: "Manage the income category master list (Admission Fee, Tuition Fee, ...)",
    permission: "finance.master.manage",
  },
  {
    href: "/finance/expense-categories",
    label: "Expense Categories",
    description: "Manage the expense category master list (Salary, Electric Bill, ...)",
    permission: "finance.master.manage",
  },
  {
    href: "/finance/income",
    label: "Income",
    description: "Record and review income entries",
    permission: "finance.income.manage",
  },
  {
    href: "/finance/expense",
    label: "Expense",
    description: "Record and review expense entries",
    permission: "finance.expense.manage",
  },
  {
    href: "/finance/dashboard",
    label: "Finance Dashboard",
    description: "Today's and this month's income/expense, and current balances",
    permission: "finance.report.view",
  },
  {
    href: "/finance/reports",
    label: "Finance Reports",
    description: "Income, expense, category-wise, and monthly summary reports",
    permission: "finance.report.view",
  },
];

export default async function FinanceHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Finance & Accounts</h1>
      <p className="mt-1 text-sm text-zinc-500">
        A simple cash/bank ledger — finance accounts, income and expense entries, and reports.
      </p>

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
