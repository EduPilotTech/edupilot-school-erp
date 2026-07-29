// Pure, no "server-only" import — deliberately unit-testable in isolation, mirroring
// modules/timetable/application/period-validation.helpers.ts's own shape (an ordered,
// non-overlapping range list is the same class of problem whether the ranges are times or
// percentages).
export interface GradeBandValidationInput {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
}

// Returns an error message if the band list is invalid, or null if it's valid. Checks: each
// band's min before its own max, both within [0, 100], no two bands overlapping regardless of
// declared order, and no duplicate grade label.
export function validateGradeBands(bands: GradeBandValidationInput[]): string | null {
  if (bands.length === 0) {
    return "At least one grade band is required.";
  }

  const seenGrades = new Set<string>();
  for (const band of bands) {
    if (band.minPercentage < 0 || band.maxPercentage > 100) {
      return `Grade "${band.grade}"'s range must be within 0-100.`;
    }
    if (band.minPercentage >= band.maxPercentage) {
      return `Grade "${band.grade}"'s minimum percentage must be before its maximum.`;
    }
    if (seenGrades.has(band.grade)) {
      return `Grade "${band.grade}" is duplicated.`;
    }
    seenGrades.add(band.grade);
  }

  const sorted = [...bands].sort((a, b) => a.minPercentage - b.minPercentage);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].minPercentage < sorted[i - 1].maxPercentage) {
      return `Grade "${sorted[i].grade}" overlaps with grade "${sorted[i - 1].grade}".`;
    }
  }

  return null;
}

// Looks up the grade for a percentage against an already-validated (ordered, non-overlapping)
// band list — used by result-generation.service.ts. `maxPercentage` is treated as inclusive on
// the topmost band (100) and exclusive elsewhere, so adjacent bands like 80-90/90-100 don't both
// match 90 — a percentage exactly on a boundary belongs to the band it opens, not the one it
// closes, except for the very top of the scale.
export function resolveGrade<T extends GradeBandValidationInput>(percentage: number, bands: T[]): T | null {
  const sorted = [...bands].sort((a, b) => a.minPercentage - b.minPercentage);
  for (let i = 0; i < sorted.length; i += 1) {
    const band = sorted[i];
    const isTopBand = i === sorted.length - 1;
    if (percentage >= band.minPercentage && (isTopBand ? percentage <= band.maxPercentage : percentage < band.maxPercentage)) {
      return band;
    }
  }
  return null;
}
