import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "@/lib/errors";
import { TeacherAssignmentInUseError } from "./errors";

describe("TeacherAssignmentInUseError", () => {
  it("is a BusinessRuleError", () => {
    const error = new TeacherAssignmentInUseError();
    expect(error).toBeInstanceOf(BusinessRuleError);
  });

  it("carries a clear default message naming the cause", () => {
    const error = new TeacherAssignmentInUseError();
    expect(error.message).toMatch(/active timetable entries/i);
  });

  it("accepts a custom message", () => {
    const error = new TeacherAssignmentInUseError("custom message");
    expect(error.message).toBe("custom message");
  });

  it("sets its name to the class name, not the generic base 'Error'", () => {
    const error = new TeacherAssignmentInUseError();
    expect(error.name).toBe("TeacherAssignmentInUseError");
  });
});
