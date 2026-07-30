import { describe, expect, it } from "vitest";
import { isGenderCompatible } from "./hostel-gender.helpers";

describe("isGenderCompatible", () => {
  it("allows any student into a CO_ED room", () => {
    expect(isGenderCompatible("MALE", "CO_ED")).toBe(true);
    expect(isGenderCompatible("FEMALE", "CO_ED")).toBe(true);
    expect(isGenderCompatible(null, "CO_ED")).toBe(true);
  });

  it("allows a student with no recorded gender into any room", () => {
    expect(isGenderCompatible(null, "BOYS")).toBe(true);
    expect(isGenderCompatible(null, "GIRLS")).toBe(true);
  });

  it("matches MALE to BOYS and FEMALE to GIRLS", () => {
    expect(isGenderCompatible("MALE", "BOYS")).toBe(true);
    expect(isGenderCompatible("FEMALE", "GIRLS")).toBe(true);
  });

  it("rejects a known mismatch", () => {
    expect(isGenderCompatible("MALE", "GIRLS")).toBe(false);
    expect(isGenderCompatible("FEMALE", "BOYS")).toBe(false);
  });

  it("rejects an OTHER gender from single-gender rooms", () => {
    expect(isGenderCompatible("OTHER", "BOYS")).toBe(false);
    expect(isGenderCompatible("OTHER", "GIRLS")).toBe(false);
  });
});
