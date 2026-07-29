import { describe, expect, it } from "vitest";
import { createTimetableEntrySchema, updateTimetableEntrySchema } from "./timetable-entry.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createTimetableEntrySchema", () => {
  it("accepts a valid payload without a classroom", () => {
    const result = createTimetableEntrySchema.safeParse({
      teacherAssignmentId: VALID_UUID,
      periodId: VALID_UUID,
      dayOfWeek: "MONDAY",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload with a classroom", () => {
    const result = createTimetableEntrySchema.safeParse({
      teacherAssignmentId: VALID_UUID,
      periodId: VALID_UUID,
      dayOfWeek: "MONDAY",
      classroomId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid dayOfWeek", () => {
    const result = createTimetableEntrySchema.safeParse({
      teacherAssignmentId: VALID_UUID,
      periodId: VALID_UUID,
      dayOfWeek: "FUNDAY",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTimetableEntrySchema", () => {
  it("requires teacherAssignmentId", () => {
    const result = updateTimetableEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a valid payload", () => {
    const result = updateTimetableEntrySchema.safeParse({ teacherAssignmentId: VALID_UUID });
    expect(result.success).toBe(true);
  });
});
