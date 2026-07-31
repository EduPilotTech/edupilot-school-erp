import { describe, expect, it } from "vitest";
import {
  markStudentAttendanceSchema,
  bulkMarkStudentAttendanceSchema,
  markTeacherAttendanceSchema,
} from "./attendance.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_2 = "22222222-2222-4222-8222-222222222222";

describe("markStudentAttendanceSchema", () => {
  it("accepts a valid single-mark payload", () => {
    const result = markStudentAttendanceSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      status: "PRESENT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = markStudentAttendanceSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      status: "ON_LEAVE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid studentId", () => {
    const result = markStudentAttendanceSchema.safeParse({
      studentId: "not-a-uuid",
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      status: "PRESENT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects remarks longer than 500 characters", () => {
    const result = markStudentAttendanceSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      status: "PRESENT",
      remarks: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkMarkStudentAttendanceSchema", () => {
  it("accepts a payload with at least one entry", () => {
    const result = bulkMarkStudentAttendanceSchema.safeParse({
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      entries: [{ studentId: VALID_UUID_2, status: "PRESENT" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty entries array", () => {
    const result = bulkMarkStudentAttendanceSchema.safeParse({
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      entries: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an entry with an invalid status", () => {
    const result = bulkMarkStudentAttendanceSchema.safeParse({
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
      date: "2026-07-28",
      entries: [{ studentId: VALID_UUID_2, status: "SICK" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("markTeacherAttendanceSchema", () => {
  it("accepts a valid payload", () => {
    const result = markTeacherAttendanceSchema.safeParse({
      userProfileId: VALID_UUID,
      date: "2026-07-28",
      status: "ABSENT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing userProfileId", () => {
    const result = markTeacherAttendanceSchema.safeParse({
      date: "2026-07-28",
      status: "ABSENT",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid checkInTime/checkOutTime HH:mm strings", () => {
    const result = markTeacherAttendanceSchema.safeParse({
      userProfileId: VALID_UUID,
      date: "2026-07-28",
      status: "PRESENT",
      checkInTime: "09:05",
      checkOutTime: "17:30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed checkInTime", () => {
    const result = markTeacherAttendanceSchema.safeParse({
      userProfileId: VALID_UUID,
      date: "2026-07-28",
      status: "PRESENT",
      checkInTime: "9:05am",
    });
    expect(result.success).toBe(false);
  });
});
