import { describe, expect, it } from "vitest";
import { createSubjectSchema, updateSubjectSchema } from "./subject.dto";

describe("createSubjectSchema", () => {
  it("accepts a valid payload", () => {
    expect(createSubjectSchema.safeParse({ name: "Mathematics", code: "MATH" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(createSubjectSchema.safeParse({ name: "", code: "MATH" }).success).toBe(false);
  });

  it("rejects an empty code", () => {
    expect(createSubjectSchema.safeParse({ name: "Mathematics", code: "" }).success).toBe(false);
  });
});

describe("updateSubjectSchema", () => {
  it("accepts a partial payload", () => {
    expect(updateSubjectSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it("accepts an empty payload", () => {
    expect(updateSubjectSchema.safeParse({}).success).toBe(true);
  });
});
