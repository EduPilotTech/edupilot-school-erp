import { describe, expect, it } from "vitest";
import { computeInstallmentDueDate, computeMonthlyDueDate } from "./billing-period.helpers";

describe("computeMonthlyDueDate", () => {
  it("builds a due date from the billing period and configured due day", () => {
    const due = computeMonthlyDueDate("2026-04", 10);
    expect(due.toISOString().slice(0, 10)).toBe("2026-04-10");
  });

  it("defaults to the 10th when no due day is configured", () => {
    const due = computeMonthlyDueDate("2026-04", null);
    expect(due.toISOString().slice(0, 10)).toBe("2026-04-10");
  });
});

describe("computeInstallmentDueDate", () => {
  it("adds the day offset to the academic session's start date", () => {
    const sessionStart = new Date("2026-04-01T00:00:00.000Z");
    const due = computeInstallmentDueDate(sessionStart, 180);
    expect(due.toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it("returns the session start date itself for a zero offset", () => {
    const sessionStart = new Date("2026-04-01T00:00:00.000Z");
    const due = computeInstallmentDueDate(sessionStart, 0);
    expect(due.toISOString().slice(0, 10)).toBe("2026-04-01");
  });
});
