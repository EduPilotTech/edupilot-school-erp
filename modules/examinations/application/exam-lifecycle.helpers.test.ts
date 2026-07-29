import { describe, expect, it } from "vitest";
import { validateStatusTransition, requiresStatus, requiresOneOfStatuses, getNextStatus } from "./exam-lifecycle.helpers";

describe("validateStatusTransition", () => {
  it("accepts every legal one-step-forward transition in order", () => {
    const order = ["DRAFT", "SCHEDULED", "ONGOING", "MARKS_ENTRY_COMPLETED", "RESULT_GENERATED", "RESULT_PUBLISHED"] as const;
    for (let i = 0; i < order.length - 1; i += 1) {
      expect(validateStatusTransition(order[i], order[i + 1])).toBeNull();
    }
  });

  it("rejects skipping a step", () => {
    expect(validateStatusTransition("DRAFT", "ONGOING")).toMatch(/one step at a time/i);
  });

  it("rejects moving backward", () => {
    expect(validateStatusTransition("ONGOING", "SCHEDULED")).toMatch(/one step at a time/i);
  });

  it("rejects a no-op transition to the same status", () => {
    expect(validateStatusTransition("ONGOING", "ONGOING")).toMatch(/one step at a time/i);
  });
});

describe("requiresStatus", () => {
  it("returns null when the current status matches", () => {
    expect(requiresStatus("ONGOING", "ONGOING")).toBeNull();
  });

  it("returns a message naming the required status when it does not match", () => {
    expect(requiresStatus("DRAFT", "ONGOING")).toMatch(/requires the exam to be ONGOING/i);
  });
});

describe("requiresOneOfStatuses", () => {
  it("returns null when the current status is in the allowed list", () => {
    expect(requiresOneOfStatuses("SCHEDULED", ["DRAFT", "SCHEDULED"])).toBeNull();
  });

  it("returns a message when the current status is not in the allowed list", () => {
    expect(requiresOneOfStatuses("ONGOING", ["DRAFT", "SCHEDULED"])).toMatch(/one of/i);
  });
});

describe("getNextStatus", () => {
  it("returns the next status in the chain", () => {
    expect(getNextStatus("DRAFT")).toBe("SCHEDULED");
    expect(getNextStatus("RESULT_GENERATED")).toBe("RESULT_PUBLISHED");
  });

  it("returns null once the exam is fully published", () => {
    expect(getNextStatus("RESULT_PUBLISHED")).toBeNull();
  });
});
