import { describe, expect, it } from "vitest";
import {
  requestHostelLeaveSchema,
  rejectHostelLeaveSchema,
  recordHostelLeaveReturnSchema,
} from "./hostel-leave-request.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("requestHostelLeaveSchema", () => {
  it("accepts each valid leave type", () => {
    for (const leaveType of ["REGULAR", "EMERGENCY", "WEEKEND"]) {
      const result = requestHostelLeaveSchema.safeParse({
        studentId: VALID_UUID,
        academicSessionId: VALID_UUID,
        leaveType,
        fromDate: "2026-08-01",
        toDate: "2026-08-03",
        reason: "Family function",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a blank reason", () => {
    const result = requestHostelLeaveSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      leaveType: "REGULAR",
      fromDate: "2026-08-01",
      toDate: "2026-08-03",
      reason: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("rejectHostelLeaveSchema", () => {
  it("requires a non-blank rejection reason", () => {
    expect(rejectHostelLeaveSchema.safeParse({ rejectionReason: "" }).success).toBe(false);
    expect(rejectHostelLeaveSchema.safeParse({ rejectionReason: "Insufficient notice" }).success).toBe(true);
  });
});

describe("recordHostelLeaveReturnSchema", () => {
  it("requires a valid actualReturnDate", () => {
    expect(recordHostelLeaveReturnSchema.safeParse({}).success).toBe(false);
    expect(recordHostelLeaveReturnSchema.safeParse({ actualReturnDate: "2026-08-04" }).success).toBe(true);
  });
});
