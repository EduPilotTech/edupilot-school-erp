// Pure — no "server-only" import, no imports at all beyond types — mirrors
// modules/payroll/application/salary-calculation.helpers.ts's own "pure logic kept separate from
// any server-only file" pattern, so this is directly unit-testable without mocking Prisma/Next.
//
// This computes a GST breakdown FROM a given taxable amount and rate — it does NOT decide the
// rate or the interstate/intrastate status itself. That decision belongs to the caller, informed
// by whatever business data is available (e.g. the platform's own registered state vs. the
// tenant school's billing state). This bundle's schema has no tenant-state/company-state data to
// auto-determine `isInterState`, so callers currently pass it explicitly — defaulting to
// `false`/intra-state is the safest assumption when unknown, but that default is the CALLER's
// decision to make (see invoice-pdf.service.ts's own call site), not something this pure function
// decides on its own.
export interface GstBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalWithTax: number;
}

// Same rounding idiom used throughout this module — see payment.service.ts's own
// `refundPayment` (`Math.round(x * 100) / 100`).
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Intra-state (isInterState=false): the rate splits evenly into CGST + SGST, IGST is 0.
// Inter-state (isInterState=true): the full rate applies as IGST, CGST and SGST are 0.
// This mirrors how Indian GST actually works: CGST+SGST together always equal the same total
// rate that would otherwise apply as a single IGST rate for an inter-state supply.
export function computeGstBreakdown(taxableAmount: number, gstRatePercent: number, isInterState: boolean): GstBreakdown {
  const cgst = isInterState ? 0 : round2((taxableAmount * gstRatePercent) / 200);
  const sgst = isInterState ? 0 : round2((taxableAmount * gstRatePercent) / 200);
  const igst = isInterState ? round2((taxableAmount * gstRatePercent) / 100) : 0;

  const totalTax = round2(cgst + sgst + igst);
  const totalWithTax = round2(taxableAmount + totalTax);

  return { taxableAmount, cgst, sgst, igst, totalTax, totalWithTax };
}
