import { describe, expect, it } from "vitest";
import { bulkMarkHostelAttendanceSchema } from "./hostel-attendance.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("bulkMarkHostelAttendanceSchema", () => {
  it("accepts a valid roster with one entry", () => {
    const result = bulkMarkHostelAttendanceSchema.safeParse({
      roomId: VALID_UUID,
      academicSessionId: VALID_UUID,
      date: "2026-07-30",
      session: "MORNING",
      entries: [{ studentId: VALID_UUID, status: "PRESENT" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty entries array", () => {
    const result = bulkMarkHostelAttendanceSchema.safeParse({
      roomId: VALID_UUID,
      academicSessionId: VALID_UUID,
      date: "2026-07-30",
      session: "MORNING",
      entries: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid session leg", () => {
    const result = bulkMarkHostelAttendanceSchema.safeParse({
      roomId: VALID_UUID,
      academicSessionId: VALID_UUID,
      date: "2026-07-30",
      session: "AFTERNOON",
      entries: [{ studentId: VALID_UUID, status: "PRESENT" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid per-entry status", () => {
    const result = bulkMarkHostelAttendanceSchema.safeParse({
      roomId: VALID_UUID,
      academicSessionId: VALID_UUID,
      date: "2026-07-30",
      session: "NIGHT",
      entries: [{ studentId: VALID_UUID, status: "LATE" }],
    });
    expect(result.success).toBe(false);
  });
});
