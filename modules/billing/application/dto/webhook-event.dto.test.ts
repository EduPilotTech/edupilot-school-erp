import { describe, expect, it } from "vitest";
import { recordWebhookEventSchema } from "./webhook-event.dto";

describe("recordWebhookEventSchema", () => {
  it("accepts a valid webhook event", () => {
    const result = recordWebhookEventSchema.safeParse({
      gatewayProvider: "RAZORPAY",
      eventType: "payment.captured",
      gatewayEventId: "evt_ABC123",
      payloadSnapshot: { id: "evt_ABC123" },
      signatureVerified: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown gateway provider", () => {
    const result = recordWebhookEventSchema.safeParse({
      gatewayProvider: "STRIPE",
      eventType: "payment.captured",
      gatewayEventId: "evt_ABC123",
      payloadSnapshot: {},
      signatureVerified: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing signatureVerified flag", () => {
    const result = recordWebhookEventSchema.safeParse({
      gatewayProvider: "RAZORPAY",
      eventType: "payment.captured",
      gatewayEventId: "evt_ABC123",
      payloadSnapshot: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty gateway event id", () => {
    const result = recordWebhookEventSchema.safeParse({
      gatewayProvider: "RAZORPAY",
      eventType: "payment.captured",
      gatewayEventId: "",
      payloadSnapshot: {},
      signatureVerified: true,
    });
    expect(result.success).toBe(false);
  });
});
