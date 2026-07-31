import { describe, expect, it } from "vitest";
import { createNotificationTemplateSchema, updateNotificationTemplateSchema } from "./notification-template.dto";

describe("createNotificationTemplateSchema", () => {
  it("accepts a valid EMAIL template with a subject and variables", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "Fee Due Reminder",
      channel: "EMAIL",
      subject: "Fee due for {{studentName}}",
      message: "An amount of {{amount}} is due on {{dueDate}}.",
      variables: ["studentName", "amount", "dueDate"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an SMS template with no subject and no variables", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "Holiday Notice SMS",
      channel: "SMS",
      message: "School will remain closed tomorrow.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "",
      channel: "SMS",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "Empty Message Template",
      channel: "SMS",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid channel", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "Bad Channel Template",
      channel: "FAX",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateNotificationTemplateSchema", () => {
  it("accepts a partial update with only isActive", () => {
    const result = updateNotificationTemplateSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty update", () => {
    const result = updateNotificationTemplateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an empty message when message is supplied", () => {
    const result = updateNotificationTemplateSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });
});
