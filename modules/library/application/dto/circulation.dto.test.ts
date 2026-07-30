import { describe, expect, it } from "vitest";
import { issueBookSchema, renewBookIssueSchema, returnBookSchema, markBookLostSchema, waiveBookIssueFineSchema } from "./circulation.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("issueBookSchema", () => {
  it("accepts a valid payload without an explicit dueDate", () => {
    const result = issueBookSchema.safeParse({
      bookCopyId: VALID_UUID,
      memberType: "STUDENT",
      memberId: VALID_UUID,
      issueDate: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid memberType", () => {
    const result = issueBookSchema.safeParse({
      bookCopyId: VALID_UUID,
      memberType: "PARENT",
      memberId: VALID_UUID,
      issueDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts each valid memberType", () => {
    for (const memberType of ["STUDENT", "TEACHER", "STAFF"]) {
      const result = issueBookSchema.safeParse({
        bookCopyId: VALID_UUID,
        memberType,
        memberId: VALID_UUID,
        issueDate: "2026-08-01",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("renewBookIssueSchema", () => {
  it("accepts an empty payload (newDueDate optional)", () => {
    expect(renewBookIssueSchema.safeParse({}).success).toBe(true);
  });
});

describe("returnBookSchema", () => {
  it("requires a returnDate", () => {
    expect(returnBookSchema.safeParse({}).success).toBe(false);
    expect(returnBookSchema.safeParse({ returnDate: "2026-08-10" }).success).toBe(true);
  });
});

describe("markBookLostSchema", () => {
  it("requires a reportedDate", () => {
    expect(markBookLostSchema.safeParse({}).success).toBe(false);
  });
});

describe("waiveBookIssueFineSchema", () => {
  it("requires a non-blank reason", () => {
    expect(waiveBookIssueFineSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(waiveBookIssueFineSchema.safeParse({ reason: "Book found on shelf" }).success).toBe(true);
  });
});
