import { describe, expect, it } from "vitest";
import { createEmployeeSchema, updateEmployeeSchema, listEmployeesSchema } from "./employee.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createEmployeeSchema", () => {
  it("accepts a minimal valid employee", () => {
    const result = createEmployeeSchema.safeParse({
      userProfileId: VALID_UUID,
      departmentId: VALID_UUID,
      designationId: VALID_UUID,
      employmentTypeId: VALID_UUID,
      employeeCode: "EMP001",
      joiningDate: "2024-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing employeeCode", () => {
    const result = createEmployeeSchema.safeParse({
      userProfileId: VALID_UUID,
      departmentId: VALID_UUID,
      designationId: VALID_UUID,
      employmentTypeId: VALID_UUID,
      employeeCode: "",
      joiningDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid userProfileId", () => {
    const result = createEmployeeSchema.safeParse({
      userProfileId: "not-a-uuid",
      departmentId: VALID_UUID,
      designationId: VALID_UUID,
      employmentTypeId: VALID_UUID,
      employeeCode: "EMP001",
      joiningDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative experienceYears", () => {
    const result = createEmployeeSchema.safeParse({
      userProfileId: VALID_UUID,
      departmentId: VALID_UUID,
      designationId: VALID_UUID,
      employmentTypeId: VALID_UUID,
      employeeCode: "EMP001",
      joiningDate: "2024-01-01",
      experienceYears: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEmployeeSchema", () => {
  it("accepts reportingManagerId explicitly set to null (detaching)", () => {
    expect(updateEmployeeSchema.safeParse({ reportingManagerId: null }).success).toBe(true);
  });

  it("rejects an invalid employmentStatus", () => {
    expect(updateEmployeeSchema.safeParse({ employmentStatus: "NOT_A_STATUS" }).success).toBe(false);
  });
});

describe("listEmployeesSchema", () => {
  it("defaults page and pageSize when omitted", () => {
    const result = listEmployeesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("rejects a pageSize above the max", () => {
    expect(listEmployeesSchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});
