import { describe, expect, it } from "vitest";
import { isTerminalPaymentStatus, isValidPaymentTransition } from "./payment-transition.helpers";
import type { PaymentStatusValue } from "../domain/payment.entity";

describe("isValidPaymentTransition", () => {
  it("allows CREATED -> AUTHORIZED", () => {
    expect(isValidPaymentTransition("CREATED", "AUTHORIZED")).toBe(true);
  });

  it("allows CREATED -> CAPTURED directly (single-step gateway settlement)", () => {
    expect(isValidPaymentTransition("CREATED", "CAPTURED")).toBe(true);
  });

  it("allows AUTHORIZED -> CAPTURED", () => {
    expect(isValidPaymentTransition("AUTHORIZED", "CAPTURED")).toBe(true);
  });

  it("allows CAPTURED -> REFUNDED and CAPTURED -> PARTIALLY_REFUNDED", () => {
    expect(isValidPaymentTransition("CAPTURED", "REFUNDED")).toBe(true);
    expect(isValidPaymentTransition("CAPTURED", "PARTIALLY_REFUNDED")).toBe(true);
  });

  it("allows PARTIALLY_REFUNDED -> PARTIALLY_REFUNDED (accumulating partial refunds)", () => {
    expect(isValidPaymentTransition("PARTIALLY_REFUNDED", "PARTIALLY_REFUNDED")).toBe(true);
  });

  it("allows PARTIALLY_REFUNDED -> REFUNDED (topping up to a full refund)", () => {
    expect(isValidPaymentTransition("PARTIALLY_REFUNDED", "REFUNDED")).toBe(true);
  });

  it("rejects any transition out of FAILED", () => {
    const targets: PaymentStatusValue[] = ["CREATED", "AUTHORIZED", "CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED", "FAILED"];
    for (const to of targets) {
      expect(isValidPaymentTransition("FAILED", to)).toBe(false);
    }
  });

  it("rejects any transition out of REFUNDED", () => {
    const targets: PaymentStatusValue[] = ["CREATED", "AUTHORIZED", "CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED", "FAILED"];
    for (const to of targets) {
      expect(isValidPaymentTransition("REFUNDED", to)).toBe(false);
    }
  });

  it("rejects going backwards from CAPTURED to CREATED", () => {
    expect(isValidPaymentTransition("CAPTURED", "CREATED")).toBe(false);
  });

  it("rejects AUTHORIZED -> PARTIALLY_REFUNDED (must be captured first)", () => {
    expect(isValidPaymentTransition("AUTHORIZED", "PARTIALLY_REFUNDED")).toBe(false);
  });
});

describe("isTerminalPaymentStatus", () => {
  it("treats FAILED and REFUNDED as terminal", () => {
    expect(isTerminalPaymentStatus("FAILED")).toBe(true);
    expect(isTerminalPaymentStatus("REFUNDED")).toBe(true);
  });

  it("treats CREATED, AUTHORIZED, CAPTURED, PARTIALLY_REFUNDED as non-terminal", () => {
    expect(isTerminalPaymentStatus("CREATED")).toBe(false);
    expect(isTerminalPaymentStatus("AUTHORIZED")).toBe(false);
    expect(isTerminalPaymentStatus("CAPTURED")).toBe(false);
    expect(isTerminalPaymentStatus("PARTIALLY_REFUNDED")).toBe(false);
  });
});
