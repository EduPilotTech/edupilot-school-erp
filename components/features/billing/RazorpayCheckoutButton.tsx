"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRazorpayOrderAction } from "@/app/billing/school-actions";

// Minimal ambient declaration for the global Razorpay Checkout.js constructor — this codebase has
// no @types/razorpay dependency, and the full SDK surface isn't needed here, just enough to call
// `new window.Razorpay(options).open()` per Razorpay's own Checkout.js integration contract.
declare global {
  interface Window {
    Razorpay: new (options: unknown) => { open: () => void };
  }
}

interface RazorpayCheckoutButtonProps {
  subscriptionInvoiceId: string;
  label?: string;
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Loads Razorpay's Checkout.js at most once per page load (a ref guard, checked again against the
// live DOM in case another instance of this component already injected it) — shared by every
// "Pay Now"/"Renew" button in the tenant-facing billing UI (Invoice Detail, Subscription page) so
// the checkout-launch logic exists in exactly one place.
//
// The `handler` callback below fires when Razorpay's own checkout modal reports the client-side
// payment attempt completed — per the approved Architecture Review (see razorpay.service.ts's own
// verifyRazorpayCheckoutSignature comment), this is a first-pass, optimistic-UI signal ONLY. It
// never calls a mutation directly; the webhook (webhook-processing.service.ts) remains the sole
// authoritative source of truth for a captured payment. This component just shows a submitted
// message and refreshes the page shortly after, so the server-rendered status has a chance to
// reflect whatever the webhook has (hopefully) already recorded by then.
export function RazorpayCheckoutButton({ subscriptionInvoiceId, label = "Pay Now" }: RazorpayCheckoutButtonProps) {
  const router = useRouter();
  const scriptLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function ensureCheckoutScriptLoaded(): Promise<void> {
    if (scriptLoadedRef.current || document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`)) {
      scriptLoadedRef.current = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load the Razorpay checkout script."));
      document.body.appendChild(script);
    });
  }

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createRazorpayOrderAction(subscriptionInvoiceId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }

      await ensureCheckoutScriptLoaded();

      const { payment, gatewayOrderId, keyId } = result.data;
      const razorpay = new window.Razorpay({
        key: keyId,
        // Amounts are rupees on our own Payment DTO, paise at the gateway — convert here, the one
        // browser-side call site, mirroring createRazorpayOrder's own server-side conversion.
        amount: Math.round(payment.amount * 100),
        currency: payment.currency,
        order_id: gatewayOrderId,
        name: "EduPilot",
        description: "Subscription Payment",
        handler: () => {
          setSubmitted(true);
          setTimeout(() => router.refresh(), 3000);
        },
        prefill: {},
        theme: { color: "#2563eb" },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout.");
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
        Payment submitted — confirmation may take a moment.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Starting checkout…" : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
