import { describe, expect, it } from "vitest";
import { computeTenureYears } from "./hr-date.helpers";

describe("computeTenureYears", () => {
  it("computes exactly 3.0 years across two leap years", () => {
    expect(computeTenureYears(new Date("2020-01-01T00:00:00Z"), new Date("2023-01-01T00:00:00Z"))).toBe(3);
  });

  it("computes a half-year tenure", () => {
    expect(computeTenureYears(new Date("2020-01-01T00:00:00Z"), new Date("2020-07-01T00:00:00Z"))).toBe(0.5);
  });

  it("returns 0 for a joining date equal to today", () => {
    const now = new Date("2026-07-30T00:00:00Z");
    expect(computeTenureYears(now, now)).toBe(0);
  });

  it("clamps to 0 rather than going negative for a future joining date", () => {
    expect(computeTenureYears(new Date("2027-01-01T00:00:00Z"), new Date("2026-07-30T00:00:00Z"))).toBe(0);
  });

  it("rounds to one decimal place", () => {
    // ~1096 days / 365.25 = 3.0007 years -> rounds to 3.0, not 3.001
    expect(computeTenureYears(new Date("2020-01-01T00:00:00Z"), new Date("2023-01-02T00:00:00Z"))).toBeCloseTo(3, 1);
  });
});
