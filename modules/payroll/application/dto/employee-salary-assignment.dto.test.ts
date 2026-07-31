import { describe, expect, it } from "vitest";
import { assignSalarySchema } from "./employee-salary-assignment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("assignSalarySchema", () => {
  it("accepts a valid salary assignment", () => {
    const result = assignSalarySchema.safeParse({
      employeeId: VALID_UUID,
      salaryStructureId: VALID_UUID,
      basicSalary: 30000,
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive basicSalary", () => {
    const result = assignSalarySchema.safeParse({
      employeeId: VALID_UUID,
      salaryStructureId: VALID_UUID,
      basicSalary: 0,
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid effectiveFrom", () => {
    const result = assignSalarySchema.safeParse({
      employeeId: VALID_UUID,
      salaryStructureId: VALID_UUID,
      basicSalary: 30000,
      effectiveFrom: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing employeeId", () => {
    const result = assignSalarySchema.safeParse({
      salaryStructureId: VALID_UUID,
      basicSalary: 30000,
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});
