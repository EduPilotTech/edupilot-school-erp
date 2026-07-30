"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertLibrarySettingsAction } from "@/app/library/actions";
import type { LibrarySettingsDTO } from "@/modules/library/application/dto/library.dto";

interface LibrarySettingsFormProps {
  libraryId: string;
  settings: LibrarySettingsDTO;
}

export function LibrarySettingsForm({ libraryId, settings }: LibrarySettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    defaultLoanPeriodDays: settings.defaultLoanPeriodDays,
    maxBooksStudent: settings.maxBooksStudent,
    maxBooksTeacher: settings.maxBooksTeacher,
    maxBooksStaff: settings.maxBooksStaff,
    maxRenewalCount: settings.maxRenewalCount,
    reservationHoldDays: settings.reservationHoldDays,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setField(key: keyof typeof form, value: number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await upsertLibrarySettingsAction(libraryId, form);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "defaultLoanPeriodDays", label: "Default Loan Period (days)" },
    { key: "maxBooksStudent", label: "Max Books — Student" },
    { key: "maxBooksTeacher", label: "Max Books — Teacher" },
    { key: "maxBooksStaff", label: "Max Books — Staff" },
    { key: "maxRenewalCount", label: "Max Renewals" },
    { key: "reservationHoldDays", label: "Reservation Hold (days)" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={field.key} className="text-xs font-medium text-zinc-500">
              {field.label}
            </label>
            <input
              id={field.key}
              type="number"
              min={0}
              value={form[field.key]}
              onChange={(e) => setField(field.key, Number(e.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save Settings"}
        </button>
        {saved && <p className="text-sm text-emerald-700">Saved.</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
