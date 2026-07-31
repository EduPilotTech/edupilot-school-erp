import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface HrHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: HrHubLink[] = [
  { href: "/hr/employees", label: "Employees", description: "Staff records, profiles, bank details, and documents", permission: "hr.employee.manage" },
  { href: "/hr/departments", label: "Departments", description: "Manage the department master list", permission: "hr.master.manage" },
  { href: "/hr/designations", label: "Designations", description: "Manage the designation master list", permission: "hr.master.manage" },
  { href: "/hr/employment-types", label: "Employment Types", description: "Manage the employment type master list", permission: "hr.master.manage" },
  { href: "/hr/leave-types", label: "Leave Types", description: "Manage the leave type master list", permission: "hr.leave.manage" },
  { href: "/hr/leave", label: "Leave Requests", description: "Apply, approve, reject, and track staff leave", permission: "hr.leave.manage" },
  { href: "/hr/attendance", label: "Staff Attendance", description: "Mark and review daily staff attendance", permission: "attendance.teacher.mark" },
  { href: "/hr/performance", label: "Performance Reviews", description: "Record and review staff performance", permission: "hr.performance.manage" },
  { href: "/hr/dashboard", label: "HR Dashboard", description: "Headcount, attrition, and leave at a glance", permission: "hr.report.view" },
  { href: "/hr/reports", label: "HR Reports", description: "Employee, attendance, leave, and department reports", permission: "hr.report.view" },
  { href: "/payroll", label: "Payroll", description: "Salary structures, payroll runs, and payslips", permission: "payroll.structure.manage" },
];

export default async function HrHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">HR & Payroll</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Employees, department master data, leave, attendance, performance, and payroll.
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
