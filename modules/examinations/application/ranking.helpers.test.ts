import { describe, expect, it } from "vitest";
import { computeRanks } from "./ranking.helpers";

describe("computeRanks", () => {
  it("ranks distinct percentages in descending order", () => {
    const ranks = computeRanks([
      { id: "a", percentage: 60 },
      { id: "b", percentage: 90 },
      { id: "c", percentage: 75 },
    ]);
    expect(ranks.find((r) => r.id === "b")?.rank).toBe(1);
    expect(ranks.find((r) => r.id === "c")?.rank).toBe(2);
    expect(ranks.find((r) => r.id === "a")?.rank).toBe(3);
  });

  it("gives tied students the same shared rank, and the next distinct score its true position (1, 1, 3)", () => {
    const ranks = computeRanks([
      { id: "a", percentage: 90 },
      { id: "b", percentage: 90 },
      { id: "c", percentage: 40 },
    ]);
    expect(ranks.find((r) => r.id === "a")?.rank).toBe(1);
    expect(ranks.find((r) => r.id === "b")?.rank).toBe(1);
    expect(ranks.find((r) => r.id === "c")?.rank).toBe(3);
  });

  it("handles a three-way tie followed by the next distinct score at position 4", () => {
    const ranks = computeRanks([
      { id: "a", percentage: 70 },
      { id: "b", percentage: 70 },
      { id: "c", percentage: 70 },
      { id: "d", percentage: 50 },
    ]);
    expect(ranks.find((r) => r.id === "a")?.rank).toBe(1);
    expect(ranks.find((r) => r.id === "b")?.rank).toBe(1);
    expect(ranks.find((r) => r.id === "c")?.rank).toBe(1);
    expect(ranks.find((r) => r.id === "d")?.rank).toBe(4);
  });

  it("returns an empty list for an empty input", () => {
    expect(computeRanks([])).toEqual([]);
  });

  it("ranks a single result as 1", () => {
    expect(computeRanks([{ id: "a", percentage: 55 }])).toEqual([{ id: "a", rank: 1 }]);
  });
});
