import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";

// Payment gateway configuration is environment-level (deployment-wide credentials — see
// modules/billing/infrastructure/payment-gateway/razorpay-env.ts), not a per-tenant setting a
// school admin can edit. This page is a read-only status display: which provider is active and
// whether its credentials are present, never the credential values themselves. Presence is
// checked directly against process.env rather than through the env module's getters, which throw
// when a variable is unset — calling those here would crash this page in any deployment that
// hasn't configured Razorpay yet.
const RAZORPAY_CONFIGURED =
  Boolean(process.env.RAZORPAY_KEY_ID) &&
  Boolean(process.env.RAZORPAY_KEY_SECRET) &&
  Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);

export default async function PaymentSettingsPage() {
  await requireAuthContext();
  await requirePermission("billing.subscription.manage");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Payment Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The payment gateway used to process your school&apos;s subscription payments.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Provider</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            <tr>
              <td className="px-4 py-2 font-medium text-zinc-900">Razorpay</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    RAZORPAY_CONFIGURED
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {RAZORPAY_CONFIGURED ? "Configured" : "Not Configured"}
                </span>
              </td>
              <td className="px-4 py-2 text-zinc-500">Active payment gateway for subscription billing.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-medium text-zinc-900">PhonePe</td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                  Reserved
                </span>
              </td>
              <td className="px-4 py-2 text-zinc-500">Recognized as a future provider; not yet available for use.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        Payment gateway credentials are configured at the platform level and cannot be changed from your
        school&apos;s settings. Contact EduPilot support if you need to update them.
      </p>
    </main>
  );
}
