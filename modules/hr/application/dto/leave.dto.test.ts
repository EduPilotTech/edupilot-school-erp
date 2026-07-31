import { describe, expect, it } from "vitest";
import {
  allocateLeaveBalanceSchema,
  applyForLeaveSchema,
  createLeaveTypeSchema,
  rejectEmployeeLeaveSchema,
} from "./leave.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createLeaveTypeSchema", () => {
  it("accepts a valid leave type", () => {
    const result = createLeaveTypeSchema.safeParse({ name: "Casual Leave", code: "CL", maxDaysPerYear: 12 });
    expect(result.success).toBe(true);
  });

  it("rejects a negative maxDaysPerYear", () => {
    const result = createLeaveTypeSchema.safeParse({ name: "Casual Leave", code: "CL", maxDaysPerYear: -1 });
    expect(result.success).toBe(false);
  });
});

describe("allocateLeaveBalanceSchema", () => {
  it("accepts a valid allocation", () => {
    const result = allocateLeaveBalanceSchema.safeParse({
      employeeId: VALID_UUID,
      leaveTypeId: VALID_UUID,
      year: 2026,
      allocatedDays: 12,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative allocatedDays", () => {
    const result = allocateLeaveBalanceSchema.safeParse({
      employeeId: VALID_UUID,
      leaveTypeId: VALID_UUID,
      year: 2026,
      allocatedDays: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("applyForLeaveSchema", () => {
  it("accepts a valid leave application", () => {
    const result = applyForLeaveSchema.safeParse({
      employeeId: VALID_UUID,
      leaveTypeId: VALID_UUID,
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      reason: "Personal work",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank reason", () => {
    const result = applyForLeaveSchema.safeParse({
      employeeId: VALID_UUID,
      leaveTypeId: VALID_UUID,
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      reason: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("rejectEmployeeLeaveSchema", () => {
  it("rejects a blank rejection reason", () => {
    expect(rejectEmployeeLeaveSchema.safeParse({ rejectionReason: "" }).success).toBe(false);
  });
});
