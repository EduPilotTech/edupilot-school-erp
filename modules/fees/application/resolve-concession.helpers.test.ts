import { describe, expect, it } from "vitest";
import { computeDiscountAmount, resolveConcession } from "./resolve-concession.helpers";
import type { FeeConcessionEntity } from "../domain/fee-concession.entity";

const BASE_CONCESSION: FeeConcessionEntity = {
  id: "concession-1",
  tenantId: "tenant-1",
  studentId: "student-1",
  academicSessionId: "session-1",
  feeCategoryId: null,
  type: "DISCOUNT",
  valueType: "PERCENTAGE",
  value: 20,
  reason: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdBy: null,
  updatedBy: null,
};

describe("resolveConcession", () => {
  it("prefers a category-specific concession over the student's session-wide concession", () => {
    const specific: FeeConcessionEntity = { ...BASE_CONCESSION, id: "concession-2", feeCategoryId: "cat-1" };
    const resolved = resolveConcession([BASE_CONCESSION, specific], "cat-1");
    expect(resolved?.id).toBe("concession-2");
  });

  it("falls back to the session-wide concession", () => {
    const resolved = resolveConcession([BASE_CONCESSION], "cat-1");
    expect(resolved?.id).toBe(BASE_CONCESSION.id);
  });

  it("returns null when the student has no concession", () => {
    expect(resolveConcession([], "cat-1")).toBeNull();
  });
});

describe("computeDiscountAmount", () => {
  it("computes a percentage discount", () => {
    expect(computeDiscountAmount(1000, BASE_CONCESSION)).toBe(200);
  });

  it("computes a fixed-amount discount", () => {
    const fixed: FeeConcessionEntity = { ...BASE_CONCESSION, valueType: "FIXED_AMOUNT", value: 150 };
    expect(computeDiscountAmount(1000, fixed)).toBe(150);
  });

  it("treats a 100%-percentage concession as a full waiver", () => {
    const waiver: FeeConcessionEntity = { ...BASE_CONCESSION, value: 100 };
    expect(computeDiscountAmount(1000, waiver)).toBe(1000);
  });

  it("never discounts more than the original amount, even if the fixed value exceeds it", () => {
    const oversized: FeeConcessionEntity = { ...BASE_CONCESSION, valueType: "FIXED_AMOUNT", value: 5000 };
    expect(computeDiscountAmount(1000, oversized)).toBe(1000);
  });

  it("returns 0 when there is no concession", () => {
    expect(computeDiscountAmount(1000, null)).toBe(0);
  });
});
