// Pure date math kept out of server-only report services so it's unit-testable directly,
// mirroring leave-balance.helpers.ts's own "pure logic kept separate from server-only files"
// pattern.

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

// Years between `joiningDate` and `asOf`, rounded to 1 decimal place. Uses the 365.25-day average
// year (accounts for leap years without needing calendar-aware month/day arithmetic). Clamped at
// zero — a `joiningDate` in the future (a data-entry error, not a real scenario) never reports
// negative tenure.
export function computeTenureYears(joiningDate: Date, asOf: Date): number {
  const diffMs = asOf.getTime() - joiningDate.getTime();
  const years = diffMs / MS_PER_YEAR;
  return Math.max(0, Math.round(years * 10) / 10);
}
