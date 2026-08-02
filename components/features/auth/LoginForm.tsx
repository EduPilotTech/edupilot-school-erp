"use client";

import { useState, type FormEvent } from "react";
import { loginAction, lookupSchoolBrandingAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import type { PublicSchoolBrandingDTO } from "@/modules/branding/application/get-public-school-branding.service";

// Mirrors this codebase's established "Manager" client-component convention (e.g.
// components/features/hr/DepartmentManager.tsx): useState for fields + submitting + error,
// calling a Server Action directly, red-bordered error box on failure. loginAction() redirects
// to /dashboard internally on success (via Next's redirect(), which the framework turns into a
// client-side navigation for an action invoked from a Client Component) — there is no explicit
// success branch here, since a successful call never resolves back into this component at all.
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completion Pass — Login page branding (checklist #1). `/login` has no tenant context before
  // credentials are submitted (see get-public-school-branding.service.ts's own comment on why),
  // so this is a purely optional, cosmetic lookup: entering the school's code shows a live
  // preview of that school's logo/name/color, but never gates or changes what loginAction()
  // actually does — email + password alone still fully determine sign-in.
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolPreview, setSchoolPreview] = useState<PublicSchoolBrandingDTO | null>(null);
  const [schoolLookupState, setSchoolLookupState] = useState<"idle" | "loading" | "not-found">("idle");

  async function handleSchoolCodeBlur() {
    const trimmed = schoolCode.trim();
    if (!trimmed) {
      setSchoolPreview(null);
      setSchoolLookupState("idle");
      return;
    }
    setSchoolLookupState("loading");
    const result = await lookupSchoolBrandingAction(trimmed);
    setSchoolPreview(result);
    setSchoolLookupState(result ? "idle" : "not-found");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <FormField label="School Code (optional)" htmlFor="login-school-code">
        <Input
          id="login-school-code"
          type="text"
          autoComplete="off"
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          onBlur={handleSchoolCodeBlur}
          placeholder="your-school-slug"
        />
      </FormField>

      {schoolLookupState === "loading" && <p className="text-xs text-zinc-400">Looking up school…</p>}
      {schoolLookupState === "not-found" && (
        <p className="text-xs text-zinc-400">No school found with that code.</p>
      )}
      {schoolPreview && (
        <div
          className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3"
          style={{ borderColor: schoolPreview.themeColor ?? undefined }}
        >
          {schoolPreview.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
            <img src={schoolPreview.logoUrl} alt="" className="h-10 w-10 rounded-full object-contain" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: schoolPreview.themeColor ?? "#2563eb" }}
            >
              {schoolPreview.schoolName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-sm font-medium text-zinc-900">{schoolPreview.schoolName}</p>
        </div>
      )}

      <FormField label="Email" htmlFor="login-email" required>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
        />
      </FormField>

      <FormField label="Password" htmlFor="login-password" required>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting || !email || !password}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
