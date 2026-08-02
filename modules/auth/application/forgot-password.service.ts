import "server-only";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import type { AuthError, AuthResult } from "./sign-in.service";

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export interface ForgotPasswordInput {
  email: string;
}

// Sends a Supabase password-reset email.
//
// Deliberately does NOT reveal whether the email belongs to a real account — returning a
// different result for "unknown email" vs. "email sent" is a classic account-enumeration
// vector. Supabase's own `resetPasswordForEmail` already behaves this way (it does not error
// for an email with no matching account), and this wrapper preserves that property by never
// adding an "email not found" branch of its own.
//
// Commercial QA — Step 1 (Authentication): `redirectTo` now points at the real reset-password
// page (app/(auth)/reset-password/page.tsx) — the "no UI" gap this comment used to document is
// closed. Caller supplies the absolute URL (Server Actions have no direct access to the
// request's own origin the way a Route Handler does — see app/(auth)/actions.ts's getOrigin()).
export async function forgotPassword(
  input: ForgotPasswordInput,
  redirectTo: string
): Promise<AuthResult<null>> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      },
    };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  if (error) {
    const mappedError: AuthError =
      error.status === 429
        ? {
            code: "RATE_LIMITED",
            message: "Too many attempts. Please wait a moment and try again.",
          }
        : { code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." };

    return { success: false, error: mappedError };
  }

  return { success: true, data: null };
}
