// Pure, no "server-only" import — deliberately unit-testable in isolation.
export interface RankableResult {
  id: string;
  percentage: number;
}

export interface RankedResult {
  id: string;
  rank: number;
}

// Phase 7 Decision 3: shared ranks for ties (1, 1, 3, ...) — two students tied for first both
// get rank 1, and the next distinct percentage gets rank 3 (its actual position), not rank 2.
// Scoped by the caller to one (examId, classId, sectionId) group — see ExamResult's own schema
// comment for why ranking defaults to "rank in section."
export function computeRanks(results: RankableResult[]): RankedResult[] {
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);

  const ranked: RankedResult[] = [];
  let currentRank = 0;
  let previousPercentage: number | null = null;

  sorted.forEach((result, index) => {
    const position = index + 1;
    if (result.percentage !== previousPercentage) {
      currentRank = position;
      previousPercentage = result.percentage;
    }
    ranked.push({ id: result.id, rank: currentRank });
  });

  return ranked;
}
