import { describe, expect, it } from "vitest";
import { sendMessageAsParentSchema, sendMessageAsTeacherSchema } from "./message.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("sendMessageAsParentSchema", () => {
  it("accepts a valid payload", () => {
    const result = sendMessageAsParentSchema.safeParse({
      studentId: VALID_UUID,
      teacherId: VALID_UUID,
      body: "How is my child doing in class?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message body", () => {
    const result = sendMessageAsParentSchema.safeParse({
      studentId: VALID_UUID,
      teacherId: VALID_UUID,
      body: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("sendMessageAsTeacherSchema", () => {
  it("accepts a valid payload keyed by guardianId rather than teacherId", () => {
    const result = sendMessageAsTeacherSchema.safeParse({
      studentId: VALID_UUID,
      guardianId: VALID_UUID,
      body: "Your child did great on today's quiz.",
    });
    expect(result.success).toBe(true);
  });
});
