// Environment variable access for the Razorpay gateway integration, with descriptive startup
// errors instead of a bare "undefined" reaching the Razorpay SDK. Mirrors
// lib/supabase/env.ts's own shape (a private requireEnvVar helper, one exported getter per
// variable) — that file's own helper isn't exported, so it's replicated here rather than
// imported, keeping this module free of any dependency beyond process.env.

function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local ` +
        `(and .env for Prisma) and set it — see docs/ENVIRONMENT_VARIABLES.md.`
    );
  }
  return value;
}

// Not itself secret, but not meant for public distribution beyond what Razorpay's own
// checkout.js requires client-side — see docs/ENVIRONMENT_VARIABLES.md's "Razorpay" section.
export function getRazorpayKeyId(): string {
  return requireEnvVar("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID);
}

// Server-only, secret. Used for order creation, capture, refund, and checkout-signature
// verification. Never expose to the browser; never prefix with NEXT_PUBLIC_.
export function getRazorpayKeySecret(): string {
  return requireEnvVar("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
}

// Server-only, secret. Distinct from RAZORPAY_KEY_SECRET — configured separately in the
// Razorpay Dashboard's webhook settings, used exclusively for webhook signature verification.
export function getRazorpayWebhookSecret(): string {
  return requireEnvVar("RAZORPAY_WEBHOOK_SECRET", process.env.RAZORPAY_WEBHOOK_SECRET);
}
