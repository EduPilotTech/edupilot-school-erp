import { describe, expect, it } from "vitest";
import { assignStudentTransportSchema, updateStudentTransportStatusSchema } from "./student-transport-assignment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("assignStudentTransportSchema", () => {
  it("defaults tripType to PICKUP_AND_DROP when omitted", () => {
    const result = assignStudentTransportSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      routeId: VALID_UUID,
      stopId: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tripType).toBe("PICKUP_AND_DROP");
    }
  });

  it("rejects an invalid tripType", () => {
    const result = assignStudentTransportSchema.safeParse({
      studentId: VALID_UUID,
      academicSessionId: VALID_UUID,
      routeId: VALID_UUID,
      stopId: VALID_UUID,
      tripType: "SOMETIMES",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateStudentTransportStatusSchema", () => {
  it("accepts each valid status", () => {
    for (const status of ["ACTIVE", "TEMPORARY_STOP", "DISCONTINUED"]) {
      expect(updateStudentTransportStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(updateStudentTransportStatusSchema.safeParse({ status: "PAUSED" }).success).toBe(false);
  });
});
