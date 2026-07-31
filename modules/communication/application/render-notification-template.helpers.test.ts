import { describe, expect, it } from "vitest";
import { renderNotificationTemplate } from "./render-notification-template.helpers";

describe("renderNotificationTemplate", () => {
  it("substitutes variables in both subject and message", () => {
    const result = renderNotificationTemplate(
      { subject: "Fee due for {{studentName}}", message: "An amount of {{amount}} is due on {{dueDate}}." },
      { studentName: "Aarav Sharma", amount: "5000", dueDate: "2026-08-15" }
    );
    expect(result).toEqual({
      subject: "Fee due for Aarav Sharma",
      message: "An amount of 5000 is due on 2026-08-15.",
    });
  });

  it("leaves a placeholder missing from the supplied variables as literal text", () => {
    const result = renderNotificationTemplate(
      { subject: null, message: "Hello {{studentName}}, your {{examName}} result is out." },
      { studentName: "Priya" }
    );
    expect(result.message).toBe("Hello Priya, your {{examName}} result is out.");
    expect(result.subject).toBeNull();
  });

  it("ignores an extra variable that the template does not reference", () => {
    const result = renderNotificationTemplate(
      { subject: null, message: "Welcome, {{studentName}}!" },
      { studentName: "Rohan", unused: "should not appear anywhere" }
    );
    expect(result.message).toBe("Welcome, Rohan!");
  });

  it("returns the template unchanged when no variables are supplied and none are referenced", () => {
    const result = renderNotificationTemplate(
      { subject: "School closed tomorrow", message: "The school will remain closed for a public holiday." },
      {}
    );
    expect(result).toEqual({
      subject: "School closed tomorrow",
      message: "The school will remain closed for a public holiday.",
    });
  });

  it("leaves every placeholder literal when no variables are supplied but the template references some", () => {
    const result = renderNotificationTemplate({ subject: null, message: "Dear {{studentName}}," }, {});
    expect(result.message).toBe("Dear {{studentName}},");
  });
});
