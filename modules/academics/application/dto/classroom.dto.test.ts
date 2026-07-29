import { describe, expect, it } from "vitest";
import { createClassroomSchema, updateClassroomSchema } from "./classroom.dto";

describe("createClassroomSchema", () => {
  it("accepts a valid payload with capacity", () => {
    expect(createClassroomSchema.safeParse({ name: "Lab 2", code: "LAB2", capacity: 40 }).success).toBe(true);
  });

  it("accepts a valid payload without capacity", () => {
    expect(createClassroomSchema.safeParse({ name: "Lab 2", code: "LAB2" }).success).toBe(true);
  });

  it("rejects a non-positive capacity", () => {
    expect(createClassroomSchema.safeParse({ name: "Lab 2", code: "LAB2", capacity: 0 }).success).toBe(false);
  });

  it("rejects an empty code", () => {
    expect(createClassroomSchema.safeParse({ name: "Lab 2", code: "" }).success).toBe(false);
  });
});

describe("updateClassroomSchema", () => {
  it("accepts clearing capacity to null", () => {
    expect(updateClassroomSchema.safeParse({ capacity: null }).success).toBe(true);
  });
});
