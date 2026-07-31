import { describe, expect, it } from "vitest";
import {
  createDepartmentSchema,
  createDesignationSchema,
  createEmploymentTypeSchema,
  updateDesignationSchema,
} from "./hr-master.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createDepartmentSchema", () => {
  it("rejects a blank code", () => {
    const result = createDepartmentSchema.safeParse({ name: "Administration", code: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid department", () => {
    const result = createDepartmentSchema.safeParse({ name: "Administration", code: "ADMIN" });
    expect(result.success).toBe(true);
  });
});

describe("createDesignationSchema", () => {
  it("accepts a designation without a department (department-agnostic)", () => {
    const result = createDesignationSchema.safeParse({ name: "Librarian", code: "LIB" });
    expect(result.success).toBe(true);
  });

  it("accepts a designation with a valid departmentId", () => {
    const result = createDesignationSchema.safeParse({ departmentId: VALID_UUID, name: "HOD", code: "HOD" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid departmentId", () => {
    const result = createDesignationSchema.safeParse({ departmentId: "not-a-uuid", name: "HOD", code: "HOD" });
    expect(result.success).toBe(false);
  });
});

describe("updateDesignationSchema", () => {
  it("accepts departmentId explicitly set to null (detaching)", () => {
    expect(updateDesignationSchema.safeParse({ departmentId: null }).success).toBe(true);
  });
});

describe("createEmploymentTypeSchema", () => {
  it("rejects a blank name", () => {
    expect(createEmploymentTypeSchema.safeParse({ name: "", code: "FT" }).success).toBe(false);
  });

  it("accepts a valid employment type", () => {
    expect(createEmploymentTypeSchema.safeParse({ name: "Full-Time", code: "FT" }).success).toBe(true);
  });
});
