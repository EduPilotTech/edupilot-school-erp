import { describe, expect, it } from "vitest";
import { listSubscriptionInvoicesSchema } from "./subscription-invoice.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("listSubscriptionInvoicesSchema", () => {
  it("accepts a valid subscription id", () => {
    expect(listSubscriptionInvoicesSchema.safeParse({ subscriptionId: VALID_UUID }).success).toBe(true);
  });

  it("rejects a non-uuid subscription id", () => {
    expect(listSubscriptionInvoicesSchema.safeParse({ subscriptionId: "not-a-uuid" }).success).toBe(false);
  });
});
