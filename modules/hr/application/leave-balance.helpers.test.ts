import { describe, expect, it } from "vitest";
import { computeAvailableLeaveDays } from "./leave-balance.helpers";

describe("computeAvailableLeaveDays", () => {
  it("adds allocated and carried-forward days, subtracting used days", () => {
    expect(computeAvailableLeaveDays({ allocatedDays: 12, usedDays: 3, carriedForwardDays: 2 })).toBe(11);
  });

  it("returns the full allocation when nothing has been used", () => {
    expect(computeAvailableLeaveDays({ allocatedDays: 10, usedDays: 0, carriedForwardDays: 0 })).toBe(10);
  });

  it("can go negative when usedDays exceeds allocated + carried forward", () => {
    expect(computeAvailableLeaveDays({ allocatedDays: 5, usedDays: 8, carriedForwardDays: 0 })).toBe(-3);
  });
});
