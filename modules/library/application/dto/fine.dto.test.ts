import { describe, expect, it } from "vitest";
import { generateLibraryFineInvoiceSchema } from "./fine.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("generateLibraryFineInvoiceSchema", () => {
  it("accepts a payload without an override amount", () => {
    expect(generateLibraryFineInvoiceSchema.safeParse({ feeCategoryId: VALID_UUID }).success).toBe(true);
  });

  it("accepts a valid administrator override amount", () => {
    expect(generateLibraryFineInvoiceSchema.safeParse({ feeCategoryId: VALID_UUID, overrideAmount: 150 }).success).toBe(true);
  });

  it("rejects a negative override amount", () => {
    expect(generateLibraryFineInvoiceSchema.safeParse({ feeCategoryId: VALID_UUID, overrideAmount: -10 }).success).toBe(false);
  });

  it("rejects a missing feeCategoryId", () => {
    expect(generateLibraryFineInvoiceSchema.safeParse({}).success).toBe(false);
  });
});
