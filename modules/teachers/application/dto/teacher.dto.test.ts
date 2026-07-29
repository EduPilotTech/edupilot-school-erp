import { describe, expect, it } from "vitest";
import { createTeacherSchema, updateTeacherSchema } from "./teacher.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createTeacherSchema", () => {
  it("accepts a valid payload", () => {
    const result = createTeacherSchema.safeParse({
      userProfileId: VALID_UUID,
      employeeCode: "EMP-001",
      joiningDate: "2026-04-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid userProfileId", () => {
    const result = createTeacherSchema.safeParse({
      userProfileId: "not-a-uuid",
      employeeCode: "EMP-001",
      joiningDate: "2026-04-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing employeeCode", () => {
    const result = createTeacherSchema.safeParse({ userProfileId: VALID_UUID, joiningDate: "2026-04-01" });
    expect(result.success).toBe(false);
  });
});

describe("updateTeacherSchema", () => {
  it("accepts clearing qualification to null", () => {
    expect(updateTeacherSchema.safeParse({ qualification: null }).success).toBe(true);
  });

  it("accepts an empty payload", () => {
    expect(updateTeacherSchema.safeParse({}).success).toBe(true);
  });
});
