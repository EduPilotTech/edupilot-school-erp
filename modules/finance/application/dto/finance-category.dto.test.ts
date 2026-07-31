import { describe, expect, it } from "vitest";
import {
  createExpenseCategorySchema,
  createIncomeCategorySchema,
  updateExpenseCategorySchema,
  updateIncomeCategorySchema,
} from "./finance-category.dto";

describe("createIncomeCategorySchema", () => {
  it("accepts a valid category", () => {
    expect(createIncomeCategorySchema.safeParse({ name: "Tuition Fee", code: "TUITION" }).success).toBe(true);
  });

  it("rejects a blank code", () => {
    expect(createIncomeCategorySchema.safeParse({ name: "Tuition Fee", code: "" }).success).toBe(false);
  });
});

describe("updateIncomeCategorySchema", () => {
  it("accepts a partial update with only isActive", () => {
    expect(updateIncomeCategorySchema.safeParse({ isActive: false }).success).toBe(true);
  });
});

describe("createExpenseCategorySchema", () => {
  it("accepts a valid category", () => {
    expect(createExpenseCategorySchema.safeParse({ name: "Utilities", code: "UTIL" }).success).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(createExpenseCategorySchema.safeParse({ name: "", code: "UTIL" }).success).toBe(false);
  });
});

describe("updateExpenseCategorySchema", () => {
  it("accepts a partial update with only code", () => {
    expect(updateExpenseCategorySchema.safeParse({ code: "UTIL2" }).success).toBe(true);
  });
});
