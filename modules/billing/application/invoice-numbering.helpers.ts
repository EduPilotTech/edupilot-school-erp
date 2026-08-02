// Pure, no "server-only" import — deliberately unit-testable in isolation.

// India's financial year runs 1 April - 31 March. A date in Jan-Mar belongs to the FY that
// started the previous April (e.g. 2 Jan 2027 is FY "2026-27", not "2027-28"). Format matches the
// normal short form used on statutory/GST invoices: "YYYY-YY" (start year, then the two-digit end
// year).
export function resolveFinancialYear(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}
