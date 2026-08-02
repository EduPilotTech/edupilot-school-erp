import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import {
  getPlatformCompanyName,
  getPlatformCompanyAddress,
  getPlatformGstin,
} from "@/modules/billing/infrastructure/platform-billing-identity.env";

// The platform's own invoicing identity, as it will appear on invoices issued to this school.
// getPlatformCompanyName/Address/Gstin throw when their backing env var is unset (see
// platform-billing-identity.env.ts), so each is read defensively here — a deployment that hasn't
// configured these yet must still render this settings page rather than 500.
function readIdentityField(getter: () => string): string | null {
  try {
    return getter();
  } catch {
    return null;
  }
}

export default async function BillingSettingsPage() {
  await requireAuthContext();
  await requirePermission("billing.subscription.manage");

  const companyName = readIdentityField(getPlatformCompanyName);
  const companyAddress = readIdentityField(getPlatformCompanyAddress);
  const gstin = readIdentityField(getPlatformGstin);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Billing Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The invoicing identity EduPilot uses on invoices issued to your school, and links to your
        subscription details.
      </p>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Invoicing Identity</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500">Company Name</dt>
            <dd className="text-zinc-900">{companyName ?? "Not Configured"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Company Address</dt>
            <dd className="text-zinc-900">{companyAddress ?? "Not Configured"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">GSTIN</dt>
            <dd className="text-zinc-900">{gstin ?? "Not Configured"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Your Subscription</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your plan, review usage, and take subscription actions from the Billing area.
        </p>
        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:gap-4">
          <Link
            href="/billing/subscription"
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            View Current Plan &amp; Subscription
          </Link>
          <Link
            href="/billing/subscription/usage"
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            View Feature Usage &amp; Entitlements
          </Link>
        </div>
      </div>
    </main>
  );
}
