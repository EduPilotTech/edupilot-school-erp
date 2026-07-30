import { describe, expect, it } from "vitest";
import { logHostelVisitorSchema } from "./hostel-visitor.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("logHostelVisitorSchema", () => {
  it("accepts a valid entry without approvedBy", () => {
    const result = logHostelVisitorSchema.safeParse({
      studentId: VALID_UUID,
      visitorName: "Jane Doe",
      relation: "Mother",
      purpose: "Weekly visit",
      entryTime: "2026-07-30T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank purpose", () => {
    const result = logHostelVisitorSchema.safeParse({
      studentId: VALID_UUID,
      visitorName: "Jane Doe",
      relation: "Mother",
      purpose: "",
      entryTime: "2026-07-30T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing entryTime", () => {
    const result = logHostelVisitorSchema.safeParse({
      studentId: VALID_UUID,
      visitorName: "Jane Doe",
      relation: "Mother",
      purpose: "Weekly visit",
    });
    expect(result.success).toBe(false);
  });
});
