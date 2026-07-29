import { describe, expect, it } from "vitest";
import { validatePeriods } from "./period-validation.helpers";

function time(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

describe("validatePeriods", () => {
  it("accepts a valid, non-overlapping, ordered period list", () => {
    const result = validatePeriods([
      { periodNumber: 1, startTime: time("09:00"), endTime: time("09:45") },
      { periodNumber: 2, startTime: time("09:45"), endTime: time("10:00") },
      { periodNumber: 3, startTime: time("10:00"), endTime: time("10:45") },
    ]);
    expect(result).toBeNull();
  });

  it("rejects a duplicate period number", () => {
    const result = validatePeriods([
      { periodNumber: 1, startTime: time("09:00"), endTime: time("09:45") },
      { periodNumber: 1, startTime: time("10:00"), endTime: time("10:45") },
    ]);
    expect(result).toMatch(/duplicated/i);
  });

  it("rejects a period whose start is not before its end", () => {
    const result = validatePeriods([{ periodNumber: 1, startTime: time("09:45"), endTime: time("09:00") }]);
    expect(result).toMatch(/start time must be before/i);
  });

  it("rejects two periods that overlap in time regardless of declared order", () => {
    const result = validatePeriods([
      { periodNumber: 2, startTime: time("09:30"), endTime: time("10:15") },
      { periodNumber: 1, startTime: time("09:00"), endTime: time("09:45") },
    ]);
    expect(result).toMatch(/overlaps/i);
  });

  it("accepts adjacent periods that touch but do not overlap", () => {
    const result = validatePeriods([
      { periodNumber: 1, startTime: time("09:00"), endTime: time("09:45") },
      { periodNumber: 2, startTime: time("09:45"), endTime: time("10:30") },
    ]);
    expect(result).toBeNull();
  });
});
