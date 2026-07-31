import { describe, expect, it } from "vitest";
import { queueNotificationSchema } from "./notification-queue.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("queueNotificationSchema", () => {
  it("accepts a title/body notification with no template", () => {
    const result = queueNotificationSchema.safeParse({
      recipientUserProfileId: VALID_UUID,
      type: "HOLIDAY_NOTICE",
      title: "School closed",
      body: "The school will be closed tomorrow.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a templateId with variables and no title/body", () => {
    const result = queueNotificationSchema.safeParse({
      recipientUserProfileId: VALID_UUID,
      type: "FEE_PAYMENT_SUCCESS",
      templateId: VALID_UUID,
      variables: { amount: "5000" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a notification with neither a templateId nor title/body", () => {
    const result = queueNotificationSchema.safeParse({
      recipientUserProfileId: VALID_UUID,
      type: "HOLIDAY_NOTICE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a notification with title but no body", () => {
    const result = queueNotificationSchema.safeParse({
      recipientUserProfileId: VALID_UUID,
      type: "HOLIDAY_NOTICE",
      title: "School closed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid notification type", () => {
    const result = queueNotificationSchema.safeParse({
      recipientUserProfileId: VALID_UUID,
      type: "NOT_A_REAL_TYPE",
      title: "Hi",
      body: "There",
    });
    expect(result.success).toBe(false);
  });
});
