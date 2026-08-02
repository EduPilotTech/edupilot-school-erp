"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionAction } from "@/app/billing/school-actions";
import type { SubscriptionPlanDefinitionDTO } from "@/modules/billing/application/dto/subscription-plan-definition.dto";

interface SubscribeFormProps {
  plans: SubscriptionPlanDefinitionDTO[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// The very-first-subscription form — createSubscriptionAction doubles as both "subscribe" and
// "upgrade" (see school-actions.ts's own header comment); this is simply the branch where there
// is no `current` subscription row for createSubscription to close first.
export function SubscribeForm({ plans }: SubscribeFormProps) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createSubscriptionAction({
        subscriptionPlanDefinitionId: planId,
        billingCycle,
        effectiveFrom,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (plans.length === 0) {
    return <p className="text-sm text-zinc-500">No subscription plans are currently available. Contact support.</p>;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="subscribe-plan" className="text-xs font-medium text-zinc-500">
          Plan
        </label>
        <select
          id="subscribe-plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          {plans.map((plan) => (
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
            <input type="radio" name="billing-cycle" checked={billingCycle === "MONTHLY"} onChange={() => setBillingCycle("MONTHLY")} />
            Monthly {selectedPlan && `(₹${selectedPlan.monthlyPrice.toFixed(2)})`}
          </label>
          <label className="flex items-center gap-1.5 text-sm text-zinc-700">
            <input type="radio" name="billing-cycle" checked={billingCycle === "ANNUAL"} onChange={() => setBillingCycle("ANNUAL")} />
            Annual {selectedPlan && `(₹${selectedPlan.annualPrice.toFixed(2)})`}
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subscribe-effective-from" className="text-xs font-medium text-zinc-500">
          Effective From
        </label>
        <input
          id="subscribe-effective-from"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !planId || !effectiveFrom}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Subscribing…" : "Subscribe"}
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
