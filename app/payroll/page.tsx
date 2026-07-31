import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface PayrollHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

// Mirrors app/hr/page.tsx's hub pattern exactly. app/hr/page.tsx already links here from its own
// "Payroll" card (permission payroll.structure.manage) — this is the landing page that link opens.
const LINKS: PayrollHubLink[] = [
  {
    href: "/payroll/salary-structures",
    label: "Salary Structures",
    description: "Define salary structures and their earning/deduction components",
    permission: "payroll.structure.manage",
  },
  {
    href: "/payroll/salary-assignments",
    label: "Employee Salary Assignment",
    description: "Assign salary structures to employees and review increment history",
    permission: "payroll.structure.manage",
  },
  {
    href: "/payroll/loans",
    label: "Employee Loans & Advances",
    description: "Issue staff loans and salary advances, and track recovery",
    permission: "payroll.loan.manage",
  },
  {
    href: "/payroll/runs",
    label: "Payroll Runs",
    description: "Create and process monthly payroll runs, and manage payslips",
    permission: "payroll.run.manage",
  },
  {
    href: "/payroll/payments",
    label: "Salary Payments",
    description: "Record and reverse salary disbursements against payslips",
    permission: "payroll.payment.manage",
  },
  {
    href: "/payroll/reports",
    label: "Payroll Reports",
    description: "Payroll summaries and statutory reports",
    permission: "payroll.report.view",
  },
];

export default async function PayrollHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payroll</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Salary structures, employee salary assignment, loans and advances, payroll runs, and salary payments.
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
