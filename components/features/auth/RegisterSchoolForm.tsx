"use client";

import { useState, type FormEvent } from "react";
import { registerSchoolAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";

// The 6 enum values registerSchoolSchema requires for `board`
// (modules/auth/application/register-school.service.ts) — read directly from that file rather
// than guessed, since the service is deliberately not modified here.
const BOARD_OPTIONS = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "STATE_BOARD", label: "State Board" },
  { value: "IB", label: "IB" },
  { value: "IGCSE", label: "IGCSE" },
  { value: "OTHER", label: "Other" },
];

interface FormState {
  schoolName: string;
  registrationNumber: string;
  board: string;
  principalName: string;
  schoolEmail: string;
  schoolPhone: string;
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}

const INITIAL_STATE: FormState = {
  schoolName: "",
  registrationNumber: "",
  board: "",
  principalName: "",
  schoolEmail: "",
  schoolPhone: "",
  address: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  postalCode: "",
  adminFullName: "",
  adminEmail: "",
  adminPassword: "",
};

// One-page, single-submit form covering every field registerSchoolSchema requires, grouped
// under "School Details" and "Your Admin Account" — deliberately not a multi-step wizard, per
// the Phase 17 brief. Client-side validation is minimal (HTML `required` attributes); the
// authoritative validation is the server's zod schema, whose first error message surfaces back
// through registerSchoolAction's result, matching every other "Manager" form's error convention
// in this codebase.
export function RegisterSchoolForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await registerSchoolAction(form);
      if (!result.success) {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">School Details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="School Name" htmlFor="schoolName" required>
            <Input
              id="schoolName"
              required
              value={form.schoolName}
              onChange={(e) => setField("schoolName", e.target.value)}
            />
          </FormField>

          <FormField label="Registration Number" htmlFor="registrationNumber" required>
            <Input
              id="registrationNumber"
              required
              value={form.registrationNumber}
              onChange={(e) => setField("registrationNumber", e.target.value)}
            />
          </FormField>

          <FormField label="Board" htmlFor="board" required>
            <Select
              id="board"
              required
              options={BOARD_OPTIONS}
              placeholder="Select a board"
              value={form.board}
              onChange={(e) => setField("board", e.target.value)}
            />
          </FormField>

          <FormField label="Principal Name" htmlFor="principalName" required>
            <Input
              id="principalName"
              required
              value={form.principalName}
              onChange={(e) => setField("principalName", e.target.value)}
            />
          </FormField>

          <FormField label="School Email" htmlFor="schoolEmail" required>
            <Input
              id="schoolEmail"
              type="email"
              required
              value={form.schoolEmail}
              onChange={(e) => setField("schoolEmail", e.target.value)}
            />
          </FormField>

          <FormField label="School Phone" htmlFor="schoolPhone" required>
            <Input
              id="schoolPhone"
              type="tel"
              required
              value={form.schoolPhone}
              onChange={(e) => setField("schoolPhone", e.target.value)}
            />
          </FormField>

          <FormField label="Address" htmlFor="address" required>
            <Input
              id="address"
              required
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </FormField>

          <FormField label="City" htmlFor="city" required>
            <Input id="city" required value={form.city} onChange={(e) => setField("city", e.target.value)} />
          </FormField>

          <FormField label="District" htmlFor="district" required>
            <Input
              id="district"
              required
              value={form.district}
              onChange={(e) => setField("district", e.target.value)}
            />
          </FormField>

          <FormField label="State" htmlFor="state" required>
            <Input id="state" required value={form.state} onChange={(e) => setField("state", e.target.value)} />
          </FormField>

          <FormField label="Country" htmlFor="country" required>
            <Input
              id="country"
              required
              value={form.country}
              onChange={(e) => setField("country", e.target.value)}
            />
          </FormField>

          <FormField label="Postal Code" htmlFor="postalCode" required>
            <Input
              id="postalCode"
              required
              value={form.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Your Admin Account</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Your Full Name" htmlFor="adminFullName" required>
            <Input
              id="adminFullName"
              required
              value={form.adminFullName}
              onChange={(e) => setField("adminFullName", e.target.value)}
            />
          </FormField>

          <FormField label="Your Email" htmlFor="adminEmail" required>
            <Input
              id="adminEmail"
              type="email"
              autoComplete="email"
              required
              value={form.adminEmail}
              onChange={(e) => setField("adminEmail", e.target.value)}
            />
          </FormField>

          <FormField label="Password" htmlFor="adminPassword" required hint="At least 8 characters.">
            <Input
              id="adminPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.adminPassword}
              onChange={(e) => setField("adminPassword", e.target.value)}
            />
          </FormField>
        </div>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating your school…" : "Create School Account"}
      </button>
    </form>
  );
}
