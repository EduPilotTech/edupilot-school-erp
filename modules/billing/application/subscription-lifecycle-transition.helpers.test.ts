import { describe, expect, it } from "vitest";
import { isTerminalLifecycleStatus, isValidLifecycleTransition } from "./subscription-lifecycle-transition.helpers";
import type { SubscriptionStatusValue } from "../domain/subscription.entity";

const ALL_STATUSES: SubscriptionStatusValue[] = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"];

// The exact valid-transition pairs from the spec's own table.
const VALID_PAIRS: Array<[SubscriptionStatusValue, SubscriptionStatusValue]> = [
  ["TRIALING", "ACTIVE"],
  ["TRIALING", "EXPIRED"],
  ["ACTIVE", "PAST_DUE"],
  ["ACTIVE", "CANCELED"],
  ["PAST_DUE", "ACTIVE"],
  ["PAST_DUE", "EXPIRED"],
  ["PAST_DUE", "CANCELED"],
];

function isValidPair(from: SubscriptionStatusValue, to: SubscriptionStatusValue): boolean {
  return VALID_PAIRS.some(([f, t]) => f === from && t === to);
}

describe("isValidLifecycleTransition", () => {
  it("allows every pair listed in the transition table", () => {
    for (const [from, to] of VALID_PAIRS) {
      expect(isValidLifecycleTransition(from, to)).toBe(true);
    }
  });

  it("rejects every from->to pair not explicitly listed, including EXPIRED/CANCELED to anything", () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        if (isValidPair(from, to)) continue;
        expect(isValidLifecycleTransition(from, to)).toBe(false);
      }
    }
  });

  it("rejects any transition out of EXPIRED", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidLifecycleTransition("EXPIRED", to)).toBe(false);
    }
  });

  it("rejects any transition out of CANCELED", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidLifecycleTransition("CANCELED", to)).toBe(false);
    }
  });

  it("rejects a status transitioning to itself unless explicitly listed", () => {
    expect(isValidLifecycleTransition("ACTIVE", "ACTIVE")).toBe(false);
    expect(isValidLifecycleTransition("TRIALING", "TRIALING")).toBe(false);
    expect(isValidLifecycleTransition("PAST_DUE", "PAST_DUE")).toBe(false);
  });
});

describe("isTerminalLifecycleStatus", () => {
  it("treats EXPIRED and CANCELED as terminal", () => {
    expect(isTerminalLifecycleStatus("EXPIRED")).toBe(true);
    expect(isTerminalLifecycleStatus("CANCELED")).toBe(true);
  });

  it("treats TRIALING, ACTIVE, PAST_DUE as non-terminal", () => {
    expect(isTerminalLifecycleStatus("TRIALING")).toBe(false);
    expect(isTerminalLifecycleStatus("ACTIVE")).toBe(false);
    expect(isTerminalLifecycleStatus("PAST_DUE")).toBe(false);
  });
});
