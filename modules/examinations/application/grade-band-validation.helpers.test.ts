import { describe, expect, it } from "vitest";
import { validateGradeBands, resolveGrade } from "./grade-band-validation.helpers";

describe("validateGradeBands", () => {
  it("accepts a valid, ordered, non-overlapping band list", () => {
    const result = validateGradeBands([
      { minPercentage: 0, maxPercentage: 50, grade: "C" },
      { minPercentage: 50, maxPercentage: 80, grade: "B" },
      { minPercentage: 80, maxPercentage: 100, grade: "A" },
    ]);
    expect(result).toBeNull();
  });

  it("rejects an empty band list", () => {
    expect(validateGradeBands([])).toMatch(/at least one grade band/i);
  });

  it("rejects a band whose min is not before its max", () => {
    const result = validateGradeBands([{ minPercentage: 80, maxPercentage: 50, grade: "A" }]);
    expect(result).toMatch(/minimum percentage must be before/i);
  });

  it("rejects a band outside 0-100", () => {
    const result = validateGradeBands([{ minPercentage: -10, maxPercentage: 50, grade: "A" }]);
    expect(result).toMatch(/within 0-100/i);
  });

  it("rejects a duplicated grade label", () => {
    const result = validateGradeBands([
      { minPercentage: 0, maxPercentage: 50, grade: "A" },
      { minPercentage: 50, maxPercentage: 100, grade: "A" },
    ]);
    expect(result).toMatch(/duplicated/i);
  });

  it("rejects two bands that overlap regardless of declared order", () => {
    const result = validateGradeBands([
      { minPercentage: 50, maxPercentage: 100, grade: "A" },
      { minPercentage: 0, maxPercentage: 60, grade: "B" },
    ]);
    expect(result).toMatch(/overlaps/i);
  });
});

describe("resolveGrade", () => {
  const bands = [
    { minPercentage: 0, maxPercentage: 50, grade: "C" },
    { minPercentage: 50, maxPercentage: 80, grade: "B" },
    { minPercentage: 80, maxPercentage: 100, grade: "A" },
  ];

  it("resolves a percentage to the correct band", () => {
    expect(resolveGrade(45, bands)?.grade).toBe("C");
    expect(resolveGrade(65, bands)?.grade).toBe("B");
    expect(resolveGrade(95, bands)?.grade).toBe("A");
  });

  it("treats a lower boundary as belonging to the band it opens", () => {
    expect(resolveGrade(50, bands)?.grade).toBe("B");
    expect(resolveGrade(80, bands)?.grade).toBe("A");
  });

  it("treats 100 as inclusive on the top band", () => {
    expect(resolveGrade(100, bands)?.grade).toBe("A");
  });

  it("returns null when no band matches", () => {
    expect(resolveGrade(-5, bands)).toBeNull();
  });
});
