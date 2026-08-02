import { describe, expect, it } from "vitest";
import { resolveFinancialYear } from "./invoice-numbering.helpers";

describe("resolveFinancialYear", () => {
  it("resolves an April date to the FY starting that same year", () => {
    expect(resolveFinancialYear(new Date(Date.UTC(2026, 3, 1)))).toBe("2026-27"); // 1 Apr 2026
  });

  it("resolves a December date to the FY starting that same year", () => {
    expect(resolveFinancialYear(new Date(Date.UTC(2026, 11, 31)))).toBe("2026-27"); // 31 Dec 2026
  });

  it("resolves a January date to the FY starting the PREVIOUS year", () => {
    expect(resolveFinancialYear(new Date(Date.UTC(2027, 0, 2)))).toBe("2026-27"); // 2 Jan 2027
  });

  it("resolves a March date to the FY starting the previous year", () => {
    expect(resolveFinancialYear(new Date(Date.UTC(2027, 2, 31)))).toBe("2026-27"); // 31 Mar 2027
  });

  it("rolls the short end-year over correctly across a century boundary", () => {
    expect(resolveFinancialYear(new Date(Date.UTC(2099, 3, 1)))).toBe("2099-00"); // FY 2099-2100
  });
});
