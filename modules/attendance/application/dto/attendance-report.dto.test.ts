import { describe, expect, it } from "vitest";
import {
  getDailyAttendanceReportSchema,
  getClassAttendanceSummarySchema,
  getStudentAttendanceReportSchema,
  getStaffMonthlyAttendanceReportSchema,
  emptyStatusCounts,
} from "./attendance-report.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("getDailyAttendanceReportSchema", () => {
  it("accepts a valid payload and coerces the date", () => {
    const result = getDailyAttendanceReportSchema.safeParse({
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("rejects a missing classId", () => {
    const result = getDailyAttendanceReportSchema.safeParse({
      sectionId: VALID_UUID,
      date: "2026-07-28",
    });
    expect(result.success).toBe(false);
  });
});

describe("getClassAttendanceSummarySchema", () => {
  it("accepts a valid date range", () => {
    const result = getClassAttendanceSummarySchema.safeParse({
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid sectionId", () => {
    const result = getClassAttendanceSummarySchema.safeParse({
      classId: VALID_UUID,
      sectionId: "not-a-uuid",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
    expect(result.success).toBe(false);
  });
});

describe("getStudentAttendanceReportSchema", () => {
  it("accepts a valid payload", () => {
    const result = getStudentAttendanceReportSchema.safeParse({
      studentId: VALID_UUID,
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid studentId", () => {
    const result = getStudentAttendanceReportSchema.safeParse({
      studentId: "abc",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
    expect(result.success).toBe(false);
  });
});

describe("getStaffMonthlyAttendanceReportSchema", () => {
  it("accepts a valid year/month payload", () => {
    const result = getStaffMonthlyAttendanceReportSchema.safeParse({
      userProfileId: VALID_UUID,
      year: 2026,
      month: 7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a month above 12", () => {
    const result = getStaffMonthlyAttendanceReportSchema.safeParse({
      userProfileId: VALID_UUID,
      year: 2026,
      month: 13,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid userProfileId", () => {
    const result = getStaffMonthlyAttendanceReportSchema.safeParse({
      userProfileId: "not-a-uuid",
      year: 2026,
      month: 7,
    });
    expect(result.success).toBe(false);
  });
});

describe("emptyStatusCounts", () => {
  it("returns every status at zero with a zero total", () => {
    expect(emptyStatusCounts()).toEqual({
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      HALF_DAY: 0,
      LEAVE: 0,
      total: 0,
    });
  });

  it("returns a fresh object on each call", () => {
    const a = emptyStatusCounts();
    const b = emptyStatusCounts();
    a.PRESENT = 5;
    expect(b.PRESENT).toBe(0);
  });
});
