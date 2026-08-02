import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { generatePaymentReceipt } from "@/modules/billing/application/payment-receipt.service";
import { NotFoundError, BusinessRuleError, ValidationError } from "@/lib/errors";

interface ReceiptRouteParams {
  params: Promise<{ paymentId: string }>;
}

// A route handler, not a Server Action, because generatePaymentReceipt returns a raw Buffer (a
// PDF), not a DTO — the browser needs to receive it as a native file download, which a Server
// Action's JSON-serialized return value cannot do. Mirrors app/api/parent/v1's own
// requireApiAuthContext + apiErrorResponse discipline in spirit, but this is not part of that
// mobile-facing JSON API, so it reuses requireAuthContext()/requirePermission() directly — the
// same pair every other page/action in this file uses — rather than the API-specific 401/403
// variant meant for a client with no browser session/cookie redirect story.
export async function GET(_request: Request, { params }: ReceiptRouteParams): Promise<Response> {
  try {
    const authContext = await requireAuthContext();
    await requirePermission("billing.invoice.view");
    const { paymentId } = await params;

    const school = await getCurrentSchool();
    const buffer = await generatePaymentReceipt(authContext.tenantId, paymentId, {
      schoolName: school.schoolName,
      address: `${school.address}, ${school.city}, ${school.state} ${school.postalCode}`,
    });

    // Response's BodyInit union doesn't include Node's Buffer type directly (it satisfies
    // Uint8Array structurally at runtime, but TypeScript's DOM lib types don't know that) — wrap
    // in a plain Uint8Array view over the same underlying memory, no copy.
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${paymentId}.pdf"`,
      },
    });
  } catch (error) {
    // Only the known, typed domain error hierarchy is mapped to a specific status — same
    // instanceof-only discipline as translateBillingError/apiErrorResponse
    // (docs/CODING_STANDARDS.md §5). Anything else (including Next.js's own notFound() digest
    // error from requirePermission) is rethrown, letting the framework handle it rather than
    // masking it as a generic 400/404 text body.
    if (error instanceof NotFoundError) {
      return new Response(error.message, { status: 404 });
    }
    if (error instanceof BusinessRuleError || error instanceof ValidationError) {
      return new Response(error.message, { status: 400 });
    }
    throw error;
  }
}
