import { describe, expect, it } from "vitest";
import { computeFine, resolveFineRule } from "./compute-fine.helpers";
import type { FineRuleEntity } from "../domain/fine-rule.entity";

const BASE_RULE: FineRuleEntity = {
  id: "rule-1",
  tenantId: "tenant-1",
  academicSessionId: "session-1",
  feeCategoryId: null,
  name: "Catch-all",
  gracePeriodDays: 5,
  fineType: "FLAT",
  fineValue: 100,
  maxFineAmount: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdBy: null,
  updatedBy: null,
};

describe("resolveFineRule", () => {
  it("prefers a category-specific rule over the session's catch-all rule", () => {
    const specific: FineRuleEntity = { ...BASE_RULE, id: "rule-2", feeCategoryId: "cat-1" };
    const resolved = resolveFineRule([BASE_RULE, specific], "cat-1");
    expect(resolved?.id).toBe("rule-2");
  });

  it("falls back to the catch-all rule when no category-specific rule exists", () => {
    const resolved = resolveFineRule([BASE_RULE], "cat-1");
    expect(resolved?.id).toBe(BASE_RULE.id);
  });

  it("returns null when no rule applies", () => {
    expect(resolveFineRule([], "cat-1")).toBeNull();
  });
});

describe("computeFine", () => {
  it("charges nothing before the grace period has elapsed", () => {
    const dueDate = new Date("2026-01-01T00:00:00.000Z");
    const asOfDate = new Date("2026-01-04T00:00:00.000Z");
    const fine = computeFine({ amount: 1000, dueDate, asOfDate }, BASE_RULE);
    expect(fine).toBe(0);
  });

  it("charges a flat fine once past the grace period", () => {
    const dueDate = new Date("2026-01-01T00:00:00.000Z");
    const asOfDate = new Date("2026-01-10T00:00:00.000Z");
    const fine = computeFine({ amount: 1000, dueDate, asOfDate }, BASE_RULE);
    expect(fine).toBe(100);
  });

  it("charges a percentage of the invoice amount", () => {
    const rule: FineRuleEntity = { ...BASE_RULE, fineType: "PERCENTAGE", fineValue: 10 };
    const dueDate = new Date("2026-01-01T00:00:00.000Z");
    const asOfDate = new Date("2026-01-10T00:00:00.000Z");
    const fine = computeFine({ amount: 1000, dueDate, asOfDate }, rule);
    expect(fine).toBe(100);
  });

  it("accrues a per-day fine based on days past the grace period, not total overdue days", () => {
    const rule: FineRuleEntity = { ...BASE_RULE, fineType: "PER_DAY", fineValue: 10 };
    const dueDate = new Date("2026-01-01T00:00:00.000Z");
    const asOfDate = new Date("2026-01-10T00:00:00.000Z"); // 9 overdue days, 5 grace days -> 4 chargeable
    const fine = computeFine({ amount: 1000, dueDate, asOfDate }, rule);
    expect(fine).toBe(40);
  });

  it("caps the fine at maxFineAmount", () => {
    const rule: FineRuleEntity = { ...BASE_RULE, fineType: "PER_DAY", fineValue: 50, maxFineAmount: 120 };
    const dueDate = new Date("2026-01-01T00:00:00.000Z");
    const asOfDate = new Date("2026-01-20T00:00:00.000Z");
    const fine = computeFine({ amount: 1000, dueDate, asOfDate }, rule);
    expect(fine).toBe(120);
  });

  it("returns 0 when no rule applies", () => {
    const fine = computeFine(
      { amount: 1000, dueDate: new Date("2026-01-01"), asOfDate: new Date("2026-02-01") },
      null
    );
    expect(fine).toBe(0);
  });
});
