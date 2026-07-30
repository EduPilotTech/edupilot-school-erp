import { describe, expect, it } from "vitest";
import { createBookCategorySchema, createAuthorSchema, createPublisherSchema, createBookSchema, updateBookSchema } from "./catalog.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("createBookCategorySchema", () => {
  it("rejects a blank code", () => {
    const result = createBookCategorySchema.safeParse({ name: "Fiction", code: "" });
    expect(result.success).toBe(false);
  });
});

describe("createAuthorSchema", () => {
  it("accepts an author without a biography", () => {
    const result = createAuthorSchema.safeParse({ name: "Jane Austen" });
    expect(result.success).toBe(true);
  });
});

describe("createPublisherSchema", () => {
  it("rejects a blank name", () => {
    expect(createPublisherSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("createBookSchema", () => {
  it("accepts a minimal valid book without ISBN/edition/subject", () => {
    const result = createBookSchema.safeParse({
      libraryId: VALID_UUID,
      bookCategoryId: VALID_UUID,
      authorId: VALID_UUID,
      publisherId: VALID_UUID,
      title: "The Great Gatsby",
      language: "English",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.replacementCost).toBe(0);
    }
  });

  it("rejects a missing title", () => {
    const result = createBookSchema.safeParse({
      libraryId: VALID_UUID,
      bookCategoryId: VALID_UUID,
      authorId: VALID_UUID,
      publisherId: VALID_UUID,
      title: "",
      language: "English",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative replacement cost", () => {
    const result = createBookSchema.safeParse({
      libraryId: VALID_UUID,
      bookCategoryId: VALID_UUID,
      authorId: VALID_UUID,
      publisherId: VALID_UUID,
      title: "The Great Gatsby",
      language: "English",
      replacementCost: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBookSchema", () => {
  it("accepts academicSubjectId explicitly set to null (detaching)", () => {
    expect(updateBookSchema.safeParse({ academicSubjectId: null }).success).toBe(true);
  });
});
