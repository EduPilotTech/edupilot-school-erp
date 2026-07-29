import { describe, expect, it } from "vitest";
import { setWorkingDaysSchema, setPeriodConfigurationSchema, addHolidaySchema } from "./school-config.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

describe("setWorkingDaysSchema", () => {
  it("accepts exactly 7 days", () => {
    const result = setWorkingDaysSchema.safeParse({
      academicSessionId: VALID_UUID,
      days: ALL_DAYS.map((dayOfWeek) => ({ dayOfWeek, isWorking: dayOfWeek !== "SUNDAY" })),
    });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 7 days", () => {
    const result = setWorkingDaysSchema.safeParse({
      academicSessionId: VALID_UUID,
      days: [{ dayOfWeek: "MONDAY", isWorking: true }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid day name", () => {
    const result = setWorkingDaysSchema.safeParse({
      academicSessionId: VALID_UUID,
      days: [
        ...ALL_DAYS.slice(0, 6).map((dayOfWeek) => ({ dayOfWeek, isWorking: true })),
        { dayOfWeek: "FUNDAY", isWorking: true },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("setPeriodConfigurationSchema", () => {
  it("accepts a valid period list and coerces HH:mm into Date objects", () => {
    const result = setPeriodConfigurationSchema.safeParse({
      academicSessionId: VALID_UUID,
      periods: [{ periodNumber: 1, startTime: "09:00", endTime: "09:45", isBreak: false }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.periods[0].startTime).toBeInstanceOf(Date);
    }
  });

  it("rejects a malformed time string", () => {
    const result = setPeriodConfigurationSchema.safeParse({
      academicSessionId: VALID_UUID,
      periods: [{ periodNumber: 1, startTime: "9am", endTime: "09:45", isBreak: false }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty period list", () => {
    const result = setPeriodConfigurationSchema.safeParse({ academicSessionId: VALID_UUID, periods: [] });
    expect(result.success).toBe(false);
  });

  it("defaults isBreak to false when omitted", () => {
    const result = setPeriodConfigurationSchema.safeParse({
      academicSessionId: VALID_UUID,
      periods: [{ periodNumber: 1, startTime: "09:00", endTime: "09:45" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.periods[0].isBreak).toBe(false);
    }
  });
});

describe("addHolidaySchema", () => {
  it("accepts a valid payload", () => {
    const result = addHolidaySchema.safeParse({ academicSessionId: VALID_UUID, date: "2026-08-15", name: "Holiday" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = addHolidaySchema.safeParse({ academicSessionId: VALID_UUID, date: "2026-08-15", name: "" });
    expect(result.success).toBe(false);
  });
});
