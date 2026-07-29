import { describe, expect, it } from "vitest";
import { createRouteStopSchema } from "./route.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createRouteStopSchema", () => {
  it("accepts a valid payload with HH:mm pickup/drop times", () => {
    const result = createRouteStopSchema.safeParse({
      routeId: VALID_UUID,
      name: "Main Market",
      sequenceOrder: 1,
      pickupTime: "07:15",
      dropTime: "15:30",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payload with no times set", () => {
    const result = createRouteStopSchema.safeParse({
      routeId: VALID_UUID,
      name: "Main Market",
      sequenceOrder: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed pickup time", () => {
    const result = createRouteStopSchema.safeParse({
      routeId: VALID_UUID,
      name: "Main Market",
      sequenceOrder: 1,
      pickupTime: "7:15am",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a sequence order below 1", () => {
    const result = createRouteStopSchema.safeParse({
      routeId: VALID_UUID,
      name: "Main Market",
      sequenceOrder: 0,
    });
    expect(result.success).toBe(false);
  });
});
