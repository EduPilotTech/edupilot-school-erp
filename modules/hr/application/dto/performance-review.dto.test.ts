import { describe, expect, it } from "vitest";
import { createPerformanceReviewSchema } from "./performance-review.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createPerformanceReviewSchema", () => {
  it("accepts a valid review", () => {
    const result = createPerformanceReviewSchema.safeParse({
      employeeId: VALID_UUID,
      reviewPeriodStart: "2026-01-01",
      reviewPeriodEnd: "2026-06-30",
      rating: 4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a rating of 0", () => {
    const result = createPerformanceReviewSchema.safeParse({
      employeeId: VALID_UUID,
      reviewPeriodStart: "2026-01-01",
      reviewPeriodEnd: "2026-06-30",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a rating of 6", () => {
    const result = createPerformanceReviewSchema.safeParse({
      employeeId: VALID_UUID,
      reviewPeriodStart: "2026-01-01",
      reviewPeriodEnd: "2026-06-30",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });
});
