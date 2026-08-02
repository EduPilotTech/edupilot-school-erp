import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";

// Platform Admin hub — Phase 16, Bundle E Part Two. Mirrors app/hostel/page.tsx's exact hub
// pattern: a LINKS array filtered by `can(authorization, permission)`, rendered as a card grid.
// Every link here is gated on `platform.billing.manage`, the single permission code granted to
// SUPER_ADMIN (see app/billing/platform-actions.ts's own header comment) — this entire route
// tree is EduPilot's own cross-tenant staff surface, never reachable by a School Admin.
interface PlatformHubLink {
  href: string;
  label: string;
  description: string;
  permission: string;
}

const LINKS: PlatformHubLink[] = [
  {
    href: "/platform/subscriptions",
    label: "Subscription Dashboard",
    description: "Active, trialing, and past-due subscriptions, and monthly recurring revenue",
    permission: "platform.billing.manage",
  },
  {
    href: "/platform/billing",
    label: "Billing Dashboard",
    description: "Outstanding invoices, amount collected this month, and the per-school outstanding breakdown",
    permission: "platform.billing.manage",
  },
  {
    href: "/platform/payments",
    label: "Payment Dashboard",
    description: "Collections by date range and gateway provider, plus year-on-year monthly revenue",
    permission: "platform.billing.manage",
  },
  {
    href: "/platform/schools",
    label: "School Management",
    description: "Every school on the platform — suspend or reactivate an account",
    permission: "platform.billing.manage",
  },
  {
    href: "/platform/plans",
    label: "Plan Catalog",
    description: "Subscription plan definitions and their feature entitlements",
    permission: "platform.billing.manage",
  },
  {
    href: "/platform/billing-runs",
    label: "Billing Runs",
    description: "Create, process, and lock monthly billing runs that generate subscription invoices",
    permission: "platform.billing.manage",
  },
];

export default async function PlatformHubPage() {
  await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const visibleLinks = LINKS.filter((link) => can(authorization, link.permission));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Platform Admin</h1>
      <p className="mt-1 text-sm text-zinc-500">
        EduPilot&apos;s own cross-tenant operations: subscriptions, billing, payments, school accounts, the plan
        catalog, and billing runs.
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
