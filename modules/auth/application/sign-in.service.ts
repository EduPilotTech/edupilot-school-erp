import "server-only";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";

// Shared result/error shape for the auth application services. Defined here (rather than a
// fourth file) since sign-in is the first and most complete use of it — sign-out.service.ts and
// forgot-password.service.ts import it from here. Worth extracting to a shared location if a
// future service outside modules/auth also needs this shape.
export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "RATE_LIMITED"
  | "UNKNOWN_ERROR";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthResult<T> = { success: true; data: T } | { success: false; error: AuthError };

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInResult {
  userId: string;
}

// Maps a Supabase Auth error to a stable, user-facing AuthError. Never returns Supabase's raw
// message or internal error shape to the caller (docs/SECURITY_GUIDELINES.md §10) — Supabase's
// free-text error messages are not a documented, stable contract, so this only branches on the
// handful of cases that matter for UX and otherwise falls back to a generic, safe message
// rather than parsing arbitrary error text.
function mapSignInError(error: { status?: number; message: string }): AuthError {
  if (error.message.toLowerCase().includes("email not confirmed")) {
    return {
      code: "EMAIL_NOT_CONFIRMED",
      message: "Please confirm your email address before signing in.",
    };
  }

  if (error.status === 429) {
    return {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please wait a moment and try again.",
    };
  }

  return {
    code: "INVALID_CREDENTIALS",
    message: "Incorrect email or password.",
  };
}

// Signs a user in with Supabase Auth. The password is only ever passed through to Supabase's
// SDK call — never logged, never included in a thrown error, never echoed back in any form.
export async function signIn(input: SignInInput): Promise<AuthResult<SignInResult>> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Enter a valid email and password.",
      },
    };
  }

  const supabase = await supabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      success: false,
      error: mapSignInError(error ?? { message: "Unknown error" }),
    };
  }

  return { success: true, data: { userId: data.user.id } };
}
