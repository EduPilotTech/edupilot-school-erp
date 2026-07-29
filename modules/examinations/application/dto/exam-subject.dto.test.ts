import { describe, expect, it } from "vitest";
import { addExamSubjectSchema } from "./exam-subject.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("addExamSubjectSchema", () => {
  it("accepts a valid payload", () => {
    const result = addExamSubjectSchema.safeParse({
      examId: VALID_UUID,
      classId: VALID_UUID,
      subjectId: VALID_UUID,
      maxMarks: 100,
      passingMarks: 33,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive maxMarks", () => {
    const result = addExamSubjectSchema.safeParse({
      examId: VALID_UUID,
      classId: VALID_UUID,
      subjectId: VALID_UUID,
      maxMarks: 0,
      passingMarks: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative passingMarks", () => {
    const result = addExamSubjectSchema.safeParse({
      examId: VALID_UUID,
      classId: VALID_UUID,
      subjectId: VALID_UUID,
      maxMarks: 100,
      passingMarks: -1,
    });
    expect(result.success).toBe(false);
  });
});
