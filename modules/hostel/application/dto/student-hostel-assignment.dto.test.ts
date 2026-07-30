import { describe, expect, it } from "vitest";
import {
  checkInStudentHostelSchema,
  transferStudentHostelSchema,
  checkOutStudentHostelSchema,
} from "./student-hostel-assignment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("checkInStudentHostelSchema", () => {
  it("accepts a valid check-in without a diet preference", () => {
    const result = checkInStudentHostelSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      roomId: VALID_UUID,
      bedId: VALID_UUID,
      checkInDate: "2026-07-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid dietPreference", () => {
    const result = checkInStudentHostelSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      roomId: VALID_UUID,
      bedId: VALID_UUID,
      dietPreference: "KETO",
      checkInDate: "2026-07-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing checkInDate", () => {
    const result = checkInStudentHostelSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      roomId: VALID_UUID,
      bedId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });
});

describe("transferStudentHostelSchema", () => {
  it("requires both a new room and a new bed", () => {
    const result = transferStudentHostelSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      newRoomId: VALID_UUID,
      transferDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("checkOutStudentHostelSchema", () => {
  it("accepts a valid check-out payload", () => {
    const result = checkOutStudentHostelSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      checkOutDate: "2026-12-01",
    });
    expect(result.success).toBe(true);
  });
});
