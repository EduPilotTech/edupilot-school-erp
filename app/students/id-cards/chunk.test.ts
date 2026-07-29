import { describe, expect, it } from "vitest";
import { chunk } from "./chunk";

// Print Layout Test: the batch A4 sheet fits 2 columns x 4 rows (8 cards) per page — this test
// verifies the chunking math that drives id-card-batch-print.css's grid and page-break-after
// rules, independent of rendering the actual Server Component page.
describe("chunk (batch ID card print pagination)", () => {
  it("returns one page when items fit within the page size", () => {
    expect(chunk([1, 2, 3], 8)).toEqual([[1, 2, 3]]);
  });

  it("splits exactly at the page size with no trailing empty page", () => {
    const items = Array.from({ length: 16 }, (_, i) => i);
    const result = chunk(items, 8);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(8);
    expect(result[1]).toHaveLength(8);
  });

  it("puts the remainder on a final, smaller page", () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const result = chunk(items, 8);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(8);
    expect(result[1]).toHaveLength(2);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunk([], 8)).toEqual([]);
  });
});
