import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface TransportHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: TransportHubLink[] = [
  { href: "/transport/vehicles", label: "Vehicles", description: "Fleet — registration, capacity, compliance dates", permission: "transport.vehicle.manage" },
  { href: "/transport/drivers", label: "Drivers", description: "Driver records and license expiry", permission: "transport.driver.manage" },
  { href: "/transport/helpers", label: "Helpers", description: "Conductor/attendant records", permission: "transport.helper.manage" },
  { href: "/transport/routes", label: "Routes", description: "Stops, vehicle assignment, fee rules", permission: "transport.route.manage" },
  { href: "/transport/assignments", label: "Student Transport Assignment", description: "Assign a student to a route and stop", permission: "transport.student-assignment.manage" },
  { href: "/transport/fee-rules", label: "Route Fee Rules & Billing", description: "Route-wise fee amounts and invoice generation", permission: "transport.fee-rule.manage" },
  { href: "/transport/attendance", label: "Daily Transport Attendance", description: "Mark pickup/drop boarding per route", permission: "transport.attendance.mark" },
  { href: "/transport/reports/students", label: "Route-wise Student List", description: "Who rides which route and stop", permission: "transport.report.view" },
  { href: "/transport/reports/occupancy", label: "Vehicle Occupancy Report", description: "Assigned students vs. seating capacity", permission: "transport.report.view" },
  { href: "/transport/reports/compliance", label: "Compliance Alerts", description: "Expiring/expired vehicle and driver documents", permission: "transport.report.view" },
  { href: "/transport/reports/fee-collection", label: "Transport Fee Collection Report", description: "Collected vs. outstanding by route", permission: "transport.report.view" },
];

export default async function TransportHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Transport Management</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Vehicles, drivers, helpers, routes, student assignment, billing, daily attendance, and reports.
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
