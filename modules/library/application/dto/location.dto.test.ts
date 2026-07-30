import { describe, expect, it } from "vitest";
import { createRackSchema, createShelfSchema, createBookCopySchema, updateBookCopyShelfSchema } from "./location.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createRackSchema", () => {
  it("rejects a blank code", () => {
    expect(createRackSchema.safeParse({ libraryId: VALID_UUID, name: "Rack A", code: "" }).success).toBe(false);
  });
});

describe("createShelfSchema", () => {
  it("accepts a valid shelf", () => {
    expect(createShelfSchema.safeParse({ rackId: VALID_UUID, name: "Shelf 1", code: "S-1" }).success).toBe(true);
  });
});

describe("createBookCopySchema", () => {
  it("accepts a copy without an explicit accession number (auto-generated)", () => {
    const result = createBookCopySchema.safeParse({ bookId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("accepts a copy with an explicit accession number and shelf", () => {
    const result = createBookCopySchema.safeParse({ bookId: VALID_UUID, shelfId: VALID_UUID, accessionNumber: "ACC-001" });
    expect(result.success).toBe(true);
  });
});

describe("updateBookCopyShelfSchema", () => {
  it("accepts shelfId explicitly set to null (un-shelving)", () => {
    expect(updateBookCopyShelfSchema.safeParse({ shelfId: null }).success).toBe(true);
  });

  it("rejects a missing shelfId field", () => {
    expect(updateBookCopyShelfSchema.safeParse({}).success).toBe(false);
  });
});
