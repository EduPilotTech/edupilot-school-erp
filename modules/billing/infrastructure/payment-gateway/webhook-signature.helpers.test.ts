import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  deriveWebhookIdempotencyKey,
  isWebhookTimestampFresh,
  verifyWebhookSignature,
} from "./webhook-signature.helpers";

const WEBHOOK_SECRET = "whsec_test_secret_value";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly-signed body", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { amount: 4999 } });
    const signature = sign(body, WEBHOOK_SECRET);

    expect(verifyWebhookSignature(body, signature, WEBHOOK_SECRET)).toBe(true);
  });

  it("rejects a tampered body signed with the original signature", () => {
    const originalBody = JSON.stringify({ event: "payment.captured", payload: { amount: 4999 } });
    const signature = sign(originalBody, WEBHOOK_SECRET);
    const tamperedBody = JSON.stringify({ event: "payment.captured", payload: { amount: 999999 } });

    expect(verifyWebhookSignature(tamperedBody, signature, WEBHOOK_SECRET)).toBe(false);
  });

  it("rejects a correct body signed with a different secret", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { amount: 4999 } });
    const signature = sign(body, "a-completely-different-secret");

    expect(verifyWebhookSignature(body, signature, WEBHOOK_SECRET)).toBe(false);
  });

  it("returns false without throwing when the signature is the wrong length", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { amount: 4999 } });

    expect(() => verifyWebhookSignature(body, "short", WEBHOOK_SECRET)).not.toThrow();
    expect(verifyWebhookSignature(body, "short", WEBHOOK_SECRET)).toBe(false);
  });
});

describe("isWebhookTimestampFresh", () => {
  const asOf = new Date("2026-08-01T12:00:00Z");
  const asOfUnixSeconds = asOf.getTime() / 1000;

  it("treats a 30-second-old timestamp as fresh", () => {
    expect(isWebhookTimestampFresh(asOfUnixSeconds - 30, asOf)).toBe(true);
  });

  it("rejects a 10-minute-old timestamp (past the 300s default)", () => {
    expect(isWebhookTimestampFresh(asOfUnixSeconds - 600, asOf)).toBe(false);
  });

  it("treats a 30-second-in-the-future timestamp as fresh (within clock-skew allowance)", () => {
    expect(isWebhookTimestampFresh(asOfUnixSeconds + 30, asOf)).toBe(true);
  });

  it("rejects a 5-minute-in-the-future timestamp", () => {
    expect(isWebhookTimestampFresh(asOfUnixSeconds + 300, asOf)).toBe(false);
  });

  it("respects a custom maxAgeSeconds", () => {
    expect(isWebhookTimestampFresh(asOfUnixSeconds - 120, asOf, 60)).toBe(false);
    expect(isWebhookTimestampFresh(asOfUnixSeconds - 30, asOf, 60)).toBe(true);
  });
});

describe("deriveWebhookIdempotencyKey", () => {
  it("returns the header value as-is when present", () => {
    const key = deriveWebhookIdempotencyKey("RAZORPAY", "evt_abc123", "payment.captured", {
      foo: "bar",
    });
    expect(key).toBe("evt_abc123");
  });

  it("derives the same key twice for the same payload when the header is absent (determinism)", () => {
    const payload = { payment: { entity: { id: "pay_1", amount: 4999 } } };
    const keyOne = deriveWebhookIdempotencyKey("RAZORPAY", null, "payment.captured", payload);
    const keyTwo = deriveWebhookIdempotencyKey("RAZORPAY", null, "payment.captured", payload);

    expect(keyOne).toBe(keyTwo);
    expect(keyOne).toMatch(/^[0-9a-f]{64}$/);
  });

  it("derives different keys for different payloads when the header is absent", () => {
    const keyOne = deriveWebhookIdempotencyKey("RAZORPAY", null, "payment.captured", {
      payment: { entity: { id: "pay_1", amount: 4999 } },
    });
    const keyTwo = deriveWebhookIdempotencyKey("RAZORPAY", null, "payment.captured", {
      payment: { entity: { id: "pay_2", amount: 4999 } },
    });

    expect(keyOne).not.toBe(keyTwo);
  });
});
