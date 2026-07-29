import { describe, expect, it } from "vitest";
import { assignTeacherSchema } from "./teacher-assignment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("assignTeacherSchema", () => {
  it("accepts a valid payload", () => {
    const result = assignTeacherSchema.safeParse({
      teacherId: VALID_UUID,
      subjectId: VALID_UUID,
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
      sectionId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing field", () => {
    const result = assignTeacherSchema.safeParse({
      teacherId: VALID_UUID,
      subjectId: VALID_UUID,
      academicSessionId: VALID_UUID,
      classId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });
});
