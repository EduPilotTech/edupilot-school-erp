// Environment variable access for the platform's own billing identity — "who EduPilot itself
// is" on an invoice it issues to a tenant. Mirrors
// modules/billing/infrastructure/payment-gateway/razorpay-env.ts's exact shape (a private
// requireEnvVar helper + one exported getter per variable). There is no Prisma model for the
// platform's own company identity (out of scope to add one for this bundle), so environment
// configuration is the established pattern in this codebase for a deployment-specific value of
// this kind — mirrors every Razorpay/Supabase credential.
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local ` +
        `(and .env for Prisma) and set it — see docs/ENVIRONMENT_VARIABLES.md.`
    );
  }
  return value;
}

// Not secret — this appears ON invoices issued to tenants, it is not a credential. Server-only
// simply because it's only ever read while rendering a platform-issued document server-side.
export function getPlatformCompanyName(): string {
  return requireEnvVar("PLATFORM_COMPANY_NAME", process.env.PLATFORM_COMPANY_NAME);
}

// Not secret — same reasoning as getPlatformCompanyName above.
export function getPlatformCompanyAddress(): string {
  return requireEnvVar("PLATFORM_COMPANY_ADDRESS", process.env.PLATFORM_COMPANY_ADDRESS);
}

// Not secret — the platform's own GSTIN is printed on every GST tax invoice it issues, exactly
// like any other business's GSTIN on its own invoices.
export function getPlatformGstin(): string {
  return requireEnvVar("PLATFORM_GSTIN", process.env.PLATFORM_GSTIN);
}
