import { describe, expect, it } from "vitest";
import { createHomeworkSchema, setHomeworkStatusSchema } from "./homework.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createHomeworkSchema", () => {
  it("accepts a valid payload with no section (whole class)", () => {
    const result = createHomeworkSchema.safeParse({
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      subjectId: VALID_UUID,
      title: "Chapter 4 exercises",
      description: "Complete questions 1-10.",
      assignedDate: "2026-07-29",
      dueDate: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createHomeworkSchema.safeParse({
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      subjectId: VALID_UUID,
      title: "",
      description: "Complete questions 1-10.",
      assignedDate: "2026-07-29",
      dueDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("setHomeworkStatusSchema", () => {
  it("accepts a valid status transition payload", () => {
    const result = setHomeworkStatusSchema.safeParse({
      homeworkId: VALID_UUID,
      studentId: VALID_UUID,
      status: "COMPLETED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = setHomeworkStatusSchema.safeParse({
      homeworkId: VALID_UUID,
      studentId: VALID_UUID,
      status: "IN_PROGRESS",
    });
    expect(result.success).toBe(false);
  });
});
