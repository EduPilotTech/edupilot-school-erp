import { describe, expect, it } from "vitest";
import { computeExamResultTotals } from "./compute-exam-result.helpers";

describe("computeExamResultTotals", () => {
  it("sums marks and computes percentage across subjects", () => {
    const totals = computeExamResultTotals([
      { marksObtained: 80, isAbsent: false, maxMarks: 100, passingMarks: 33 },
      { marksObtained: 40, isAbsent: false, maxMarks: 50, passingMarks: 20 },
    ]);
    expect(totals.totalMarksObtained).toBe(120);
    expect(totals.totalMaxMarks).toBe(150);
    expect(totals.percentage).toBeCloseTo(80, 5);
    expect(totals.status).toBe("PASS");
  });

  it("fails the overall result if any single subject falls short of its own passing marks", () => {
    const totals = computeExamResultTotals([
      { marksObtained: 90, isAbsent: false, maxMarks: 100, passingMarks: 33 },
      { marksObtained: 10, isAbsent: false, maxMarks: 100, passingMarks: 33 },
    ]);
    // Aggregate is 50%, which would "pass" on percentage alone, but one subject failed.
    expect(totals.percentage).toBeCloseTo(50, 5);
    expect(totals.status).toBe("FAIL");
  });

  it("treats an absent subject as zero marks and an automatic fail", () => {
    const totals = computeExamResultTotals([
      { marksObtained: null, isAbsent: true, maxMarks: 100, passingMarks: 33 },
      { marksObtained: 90, isAbsent: false, maxMarks: 100, passingMarks: 33 },
    ]);
    expect(totals.totalMarksObtained).toBe(90);
    expect(totals.status).toBe("FAIL");
  });

  it("passes only when every subject clears its own passing mark", () => {
    const totals = computeExamResultTotals([
      { marksObtained: 33, isAbsent: false, maxMarks: 100, passingMarks: 33 },
      { marksObtained: 33, isAbsent: false, maxMarks: 100, passingMarks: 33 },
    ]);
    expect(totals.status).toBe("PASS");
  });

  it("returns zero percentage when there are no subjects (no max marks to divide by)", () => {
    const totals = computeExamResultTotals([]);
    expect(totals.percentage).toBe(0);
    expect(totals.status).toBe("PASS");
  });
});
