import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

interface HostelHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: HostelHubLink[] = [
  { href: "/hostel/hostels", label: "Hostels", description: "Buildings, floors, wings, rooms, and beds", permission: "hostel.manage" },
  { href: "/hostel/assignments", label: "Student Hostel Assignment", description: "Check-in, transfer, check-out, and history", permission: "hostel.assignment.manage" },
  { href: "/hostel/attendance", label: "Daily Hostel Attendance", description: "Mark morning/night attendance per room", permission: "hostel.attendance.mark" },
  { href: "/hostel/leave", label: "Leave Management", description: "Requests, approval workflow, return tracking", permission: "hostel.leave.manage" },
  { href: "/hostel/visitors", label: "Visitor Register", description: "Log entry and record exit", permission: "hostel.visitor.manage" },
  { href: "/hostel/mess", label: "Mess Management", description: "Meal plans, meal types, diet types", permission: "hostel.mess.manage" },
  { href: "/hostel/fee-rules", label: "Hostel Fee Rules & Billing", description: "Room-type fee amounts and invoice generation", permission: "hostel.fee-rule.manage" },
  { href: "/hostel/reports/room-occupancy", label: "Room Occupancy Report", description: "Capacity vs. occupied, per room", permission: "hostel.report.view" },
  { href: "/hostel/reports/bed-occupancy", label: "Bed Occupancy Report", description: "Every bed's status and occupant", permission: "hostel.report.view" },
  { href: "/hostel/reports/vacant-beds", label: "Vacant Beds Report", description: "Every bed currently available", permission: "hostel.report.view" },
  { href: "/hostel/reports/attendance", label: "Hostel Attendance Report", description: "Present/absent/on-leave counts", permission: "hostel.report.view" },
  { href: "/hostel/reports/leave", label: "Leave Report", description: "Every leave request, filterable by status", permission: "hostel.report.view" },
  { href: "/hostel/reports/visitors", label: "Visitor Report", description: "Visitor log for a date range", permission: "hostel.report.view" },
  { href: "/hostel/reports/fee-collection", label: "Hostel Fee Collection Report", description: "Collected vs. outstanding by hostel", permission: "hostel.report.view" },
];

export default async function HostelHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Hostel Management</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Hostels, rooms, beds, student assignment, attendance, leave, visitors, mess, billing, and reports.
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
