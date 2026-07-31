import { describe, expect, it } from "vitest";
import { addSalaryComponentSchema, createSalaryStructureSchema } from "./salary-structure.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createSalaryStructureSchema", () => {
  it("accepts a valid structure", () => {
    const result = createSalaryStructureSchema.safeParse({ schoolId: VALID_UUID, name: "Standard Teaching Staff" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = createSalaryStructureSchema.safeParse({ schoolId: VALID_UUID, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid schoolId", () => {
    const result = createSalaryStructureSchema.safeParse({ schoolId: "not-a-uuid", name: "Standard" });
    expect(result.success).toBe(false);
  });
});

describe("addSalaryComponentSchema", () => {
  it("accepts a valid FLAT earning component", () => {
    const result = addSalaryComponentSchema.safeParse({
      salaryStructureId: VALID_UUID,
      name: "House Rent Allowance",
      code: "HRA",
      componentType: "EARNING",
      calculationType: "FLAT",
      value: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid PERCENTAGE_OF_BASIC deduction component", () => {
    const result = addSalaryComponentSchema.safeParse({
      salaryStructureId: VALID_UUID,
      name: "Provident Fund",
      code: "PF",
      componentType: "DEDUCTION",
      calculationType: "PERCENTAGE_OF_BASIC",
      value: 12,
      isStatutory: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive value", () => {
    const result = addSalaryComponentSchema.safeParse({
      salaryStructureId: VALID_UUID,
      name: "House Rent Allowance",
      code: "HRA",
      componentType: "EARNING",
      calculationType: "FLAT",
      value: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a lowercase code", () => {
    const result = addSalaryComponentSchema.safeParse({
      salaryStructureId: VALID_UUID,
      name: "House Rent Allowance",
      code: "hra",
      componentType: "EARNING",
      calculationType: "FLAT",
      value: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid componentType", () => {
    const result = addSalaryComponentSchema.safeParse({
      salaryStructureId: VALID_UUID,
      name: "House Rent Allowance",
      code: "HRA",
      componentType: "BONUS",
      calculationType: "FLAT",
      value: 5000,
    });
    expect(result.success).toBe(false);
  });
});
