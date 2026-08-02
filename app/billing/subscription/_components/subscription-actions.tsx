"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionAction, cancelSubscriptionAction } from "@/app/billing/school-actions";
import { RazorpayCheckoutButton } from "@/components/features/billing/RazorpayCheckoutButton";
import type { SubscriptionPlanDefinitionDTO } from "@/modules/billing/application/dto/subscription-plan-definition.dto";

interface SubscriptionActionsProps {
  renewalInvoiceId: string | null;
  currentPlanCode: string;
  otherPlans: SubscriptionPlanDefinitionDTO[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Renew / Upgrade / Cancel, the three self-service actions available while a subscription is in
// an actionable status. Renew only renders the shared RazorpayCheckoutButton when the caller has
// already found an outstanding invoice for this subscription (renewalInvoiceId) — if the current
// period simply hasn't been billed yet, there is nothing to pay, and the page says so plainly
// instead of rendering a dead-end button. Upgrade reuses createSubscriptionAction — per Part
// One's own design, a plan change IS just another createSubscription call with a different
// subscriptionPlanDefinitionId (see subscription.service.ts's "APPEND-ONLY revision" comment).
export function SubscriptionActions({ renewalInvoiceId, currentPlanCode, otherPlans }: SubscriptionActionsProps) {
  const router = useRouter();
  const [upgradePlanId, setUpgradePlanId] = useState(otherPlans[0]?.id ?? "");
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [upgradeEffectiveFrom, setUpgradeEffectiveFrom] = useState(todayIsoDate());
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const selectedUpgradePlan = otherPlans.find((plan) => plan.id === upgradePlanId) ?? null;

  async function handleUpgrade() {
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const result = await createSubscriptionAction({
        subscriptionPlanDefinitionId: upgradePlanId,
        billingCycle: upgradeBillingCycle,
        effectiveFrom: upgradeEffectiveFrom,
      });
      if (!result.success) {
        setUpgradeError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsUpgrading(false);
    }
  }

  async function handleCancel() {
    const reason = window.prompt("Reason for cancelling this subscription:");
    if (!reason) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelSubscriptionAction({ reason });
      if (!result.success) {
        setCancelError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Renew</h3>
        <div className="mt-2">
          {renewalInvoiceId ? (
            <RazorpayCheckoutButton subscriptionInvoiceId={renewalInvoiceId} label="Renew Now" />
          ) : (
            <p className="text-sm text-zinc-500">Nothing to pay yet — your current period has not been billed.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Upgrade Plan</h3>
        {otherPlans.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No other plans are currently available to switch to.</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="upgrade-plan" className="text-xs font-medium text-zinc-500">
                New Plan
              </label>
              <select
                id="upgrade-plan"
                value={upgradePlanId}
                onChange={(e) => setUpgradePlanId(e.target.value)}
                className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                {otherPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">Billing Cycle</span>
              <div className="flex items-center gap-3 py-1.5">
                <label className="flex items-center gap-1.5 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="upgrade-billing-cycle"
                    checked={upgradeBillingCycle === "MONTHLY"}
                    onChange={() => setUpgradeBillingCycle("MONTHLY")}
                  />
                  Monthly {selectedUpgradePlan && `(₹${selectedUpgradePlan.monthlyPrice.toFixed(2)})`}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="upgrade-billing-cycle"
                    checked={upgradeBillingCycle === "ANNUAL"}
                    onChange={() => setUpgradeBillingCycle("ANNUAL")}
                  />
                  Annual {selectedUpgradePlan && `(₹${selectedUpgradePlan.annualPrice.toFixed(2)})`}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="upgrade-effective-from" className="text-xs font-medium text-zinc-500">
                Effective From
              </label>
              <input
                id="upgrade-effective-from"
                type="date"
                value={upgradeEffectiveFrom}
                onChange={(e) => setUpgradeEffectiveFrom(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading || !upgradePlanId || !upgradeEffectiveFrom}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpgrading ? "Switching…" : `Switch from ${currentPlanCode}`}
            </button>
          </div>
        )}
        {upgradeError && <p className="mt-2 text-sm text-red-600">{upgradeError}</p>}
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cancel Subscription</h3>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="mt-2 rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCancelling ? "Cancelling…" : "Cancel Subscription"}
        </button>
        {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
      </div>
    </div>
  );
}
