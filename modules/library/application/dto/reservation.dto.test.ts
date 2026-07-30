import { describe, expect, it } from "vitest";
import { reserveBookSchema } from "./reservation.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("reserveBookSchema", () => {
  it("accepts a valid reservation", () => {
    const result = reserveBookSchema.safeParse({
      bookId: VALID_UUID,
      memberType: "STUDENT",
      memberId: VALID_UUID,
      reservationDate: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing bookId", () => {
    const result = reserveBookSchema.safeParse({
      memberType: "STUDENT",
      memberId: VALID_UUID,
      reservationDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});
