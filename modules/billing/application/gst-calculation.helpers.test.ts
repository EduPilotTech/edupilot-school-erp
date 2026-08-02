import { describe, expect, it } from "vitest";
import { computeGstBreakdown } from "./gst-calculation.helpers";

describe("computeGstBreakdown", () => {
  it("splits a standard 18% rate evenly into CGST + SGST for an intra-state supply", () => {
    const result = computeGstBreakdown(1000, 18, false);
    expect(result).toEqual({
      taxableAmount: 1000,
      cgst: 90,
      sgst: 90,
      igst: 0,
      totalTax: 180,
      totalWithTax: 1180,
    });
  });

  it("applies the full rate as IGST for an inter-state supply", () => {
    const result = computeGstBreakdown(1000, 18, true);
    expect(result).toEqual({
      taxableAmount: 1000,
      cgst: 0,
      sgst: 0,
      igst: 180,
      totalTax: 180,
      totalWithTax: 1180,
    });
  });

  it("returns all zeros for a 0% rate, intra-state", () => {
    const result = computeGstBreakdown(1000, 0, false);
    expect(result).toEqual({
      taxableAmount: 1000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalWithTax: 1000,
    });
  });

  it("returns all zeros for a 0% rate, inter-state", () => {
    const result = computeGstBreakdown(1000, 0, true);
    expect(result).toEqual({
      taxableAmount: 1000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalWithTax: 1000,
    });
  });

  it("rounds a fractional taxable amount to 2 decimals, intra-state", () => {
    // 999.99 * 18 / 200 = 89.9991 -> rounds to 89.999... let's verify actual rounding behaviour
    const result = computeGstBreakdown(999.99, 18, false);
    expect(result.cgst).toBeCloseTo(90, 2);
    expect(result.sgst).toBeCloseTo(90, 2);
    expect(result.igst).toBe(0);
    // cgst + sgst rounded individually, then summed
    expect(result.totalTax).toBeCloseTo(result.cgst + result.sgst, 2);
    expect(result.totalWithTax).toBeCloseTo(999.99 + result.totalTax, 2);
    // Confirm exact 2-decimal rounding (no float drift beyond cents)
    expect(Number.isInteger(result.cgst * 100)).toBe(true);
    expect(Number.isInteger(result.sgst * 100)).toBe(true);
    expect(Number.isInteger(result.totalTax * 100)).toBe(true);
    expect(Number.isInteger(result.totalWithTax * 100)).toBe(true);
  });

  it("rounds a fractional taxable amount to 2 decimals, inter-state", () => {
    const result = computeGstBreakdown(999.99, 18, true);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(Number.isInteger(result.igst * 100)).toBe(true);
    expect(Number.isInteger(result.totalTax * 100)).toBe(true);
    expect(Number.isInteger(result.totalWithTax * 100)).toBe(true);
    expect(result.totalTax).toBeCloseTo(result.igst, 2);
  });
});
