"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setGradeScaleAction } from "@/app/settings/grading/actions";
import type { GradeScaleDTO } from "@/modules/examinations/application/dto/grade-scale.dto";

interface GradeScaleManagerProps {
  academicSessionId: string;
  scales: GradeScaleDTO[];
  canManage: boolean;
}

interface BandDraft {
  minPercentage: string;
  maxPercentage: string;
  grade: string;
  gradePoint: string;
}

function toDraftBands(scale: GradeScaleDTO | undefined): BandDraft[] {
  if (!scale || scale.bands.length === 0) {
    return [{ minPercentage: "0", maxPercentage: "100", grade: "A", gradePoint: "" }];
  }
  return scale.bands.map((band) => ({
    minPercentage: String(band.minPercentage),
    maxPercentage: String(band.maxPercentage),
    grade: band.grade,
    gradePoint: band.gradePoint !== null ? String(band.gradePoint) : "",
  }));
}

// Grade bands are ordered/non-overlapping (Phase 7 Decision 7, validated server-side by
// grade-band-validation.helpers.ts, mirroring the Period Configuration editor's own shape) —
// always saved as a full replace of the named scale's band list, matching
// SchoolConfigManager's period editor exactly.
export function GradeScaleManager({ academicSessionId, scales, canManage }: GradeScaleManagerProps) {
  const router = useRouter();
  const defaultScale = scales.find((scale) => scale.name === "Default");
  const [bands, setBands] = useState<BandDraft[]>(toDraftBands(defaultScale));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateBand(index: number, patch: Partial<BandDraft>) {
    setBands(bands.map((band, i) => (i === index ? { ...band, ...patch } : band)));
  }

  function addBand() {
    setBands([...bands, { minPercentage: "", maxPercentage: "", grade: "", gradePoint: "" }]);
  }

  function removeBand(index: number) {
    setBands(bands.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await setGradeScaleAction({
        academicSessionId,
        name: "Default",
        bands: bands.map((band) => ({
          minPercentage: Number(band.minPercentage),
          maxPercentage: Number(band.maxPercentage),
          grade: band.grade,
          gradePoint: band.gradePoint ? Number(band.gradePoint) : undefined,
        })),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage("Grade scale saved.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-zinc-900">Grade Scale</h2>
      <p className="mt-0.5 text-sm text-zinc-500">Percentage bands must be ordered and must not overlap.</p>

      {message && (
        <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {bands.map((band, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={band.minPercentage}
              disabled={!canManage}
              onChange={(e) => updateBand(index, { minPercentage: e.target.value })}
              placeholder="Min %"
              className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
            />
            <span className="text-sm text-zinc-500">to</span>
            <input
              type="number"
              min={0}
              max={100}
              value={band.maxPercentage}
              disabled={!canManage}
              onChange={(e) => updateBand(index, { maxPercentage: e.target.value })}
              placeholder="Max %"
              className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              value={band.grade}
              disabled={!canManage}
              onChange={(e) => updateBand(index, { grade: e.target.value })}
              placeholder="Grade"
              className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
            />
            <input
              type="number"
              value={band.gradePoint}
              disabled={!canManage}
              onChange={(e) => updateBand(index, { gradePoint: e.target.value })}
              placeholder="Grade point (optional)"
              className="w-40 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
            />
            {canManage && (
              <button type="button" onClick={() => removeBand(index)} className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={addBand}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Add Band
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save Grade Scale"}
          </button>
        </div>
      )}
    </div>
  );
}
