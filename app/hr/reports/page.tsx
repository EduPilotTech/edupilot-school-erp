import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface ReportHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

// Mirrors app/hr/page.tsx and app/payroll/page.tsx's hub pattern exactly — a permission-filtered
// grid of links. Lists every HR and Payroll report page (Phase 13 spec §11), each gated by
// whichever permission actually guards it.
const LINKS: ReportHubLink[] = [
  {
    href: "/hr/reports/employee-list",
    label: "Employee List Report",
    description: "Every employee, filterable by department and employment status",
    permission: "hr.report.view",
  },
  {
    href: "/hr/reports/attendance",
    label: "Attendance Summary Report",
    description: "Present / absent / late / half-day / leave day counts, per employee, per month",
    permission: "hr.report.view",
  },
  {
    href: "/hr/reports/leave",
    label: "Leave Report",
    description: "Every leave request, filterable by employee, leave type, status, and date range",
    permission: "hr.report.view",
  },
  {
    href: "/hr/reports/department-summary",
    label: "Department Summary Report",
    description: "Employee, active, and on-leave counts per department",
    permission: "hr.report.view",
  },
  {
    href: "/hr/reports/experience",
    label: "Experience Report",
    description: "Prior experience and tenure at this school, per employee",
    permission: "hr.report.view",
  },
  {
    href: "/payroll/reports",
    label: "Payroll Report",
    description: "One payroll run's totals and per-employee payslip breakdown",
    permission: "payroll.report.view",
  },
  {
    href: "/payroll/reports/salary-register",
    label: "Salary Register",
    description: "Department-wise payroll for one billing period, with subtotals",
    permission: "payroll.report.view",
  },
  {
    href: "/payroll/reports/ledger",
    label: "Payroll Ledger",
    description: "Running balance of payslip credits and payment debits, per employee",
    permission: "payroll.report.view",
  },
  {
    href: "/payroll/reports/audit-log",
    label: "Payroll Audit Log",
    description: "Every mutating payroll action, with before/after state",
    permission: "payroll.report.view",
  },
];

export default async function HrReportsHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">HR & Payroll Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Employee, attendance, leave, department, and payroll reports.
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
