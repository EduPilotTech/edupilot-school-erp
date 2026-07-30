import { describe, expect, it } from "vitest";
import { createMessMealPlanSchema, createMessMealSchema } from "./mess.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createMessMealPlanSchema", () => {
  it("accepts a plan without a description", () => {
    const result = createMessMealPlanSchema.safeParse({ hostelId: VALID_UUID, name: "Standard Plan" });
    expect(result.success).toBe(true);
  });
});

describe("createMessMealSchema", () => {
  it("accepts each valid mealType/dietType combination", () => {
    const result = createMessMealSchema.safeParse({
      mealPlanId: VALID_UUID,
      mealType: "LUNCH",
      dietType: "VEG",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid dietType", () => {
    const result = createMessMealSchema.safeParse({
      mealPlanId: VALID_UUID,
      mealType: "LUNCH",
      dietType: "KETO",
    });
    expect(result.success).toBe(false);
  });
});
