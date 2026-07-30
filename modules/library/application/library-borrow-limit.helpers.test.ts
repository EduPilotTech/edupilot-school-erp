import { describe, expect, it } from "vitest";
import { getMemberBorrowLimit } from "./library-borrow-limit.helpers";
import type { LibrarySettingsDTO } from "./dto/library.dto";

const settings: LibrarySettingsDTO = {
  id: "s1",
  libraryId: "lib1",
  defaultLoanPeriodDays: 14,
  maxBooksStudent: 3,
  maxBooksTeacher: 5,
  maxBooksStaff: 7,
  maxRenewalCount: 2,
  reservationHoldDays: 2,
};

describe("getMemberBorrowLimit", () => {
  it("returns the student limit for STUDENT", () => {
    expect(getMemberBorrowLimit("STUDENT", settings)).toBe(3);
  });

  it("returns the teacher limit for TEACHER", () => {
    expect(getMemberBorrowLimit("TEACHER", settings)).toBe(5);
  });

  it("returns the staff limit for STAFF", () => {
    expect(getMemberBorrowLimit("STAFF", settings)).toBe(7);
  });
});
