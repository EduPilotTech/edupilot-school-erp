// Pure, no "server-only" import — deliberately unit-testable in isolation, same reasoning as
// period-validation.helpers.ts.
export interface MarksBreakdownInput {
  marksObtained: number | null;
  isAbsent: boolean;
  maxMarks: number;
  passingMarks: number;
}

export interface ComputedExamTotals {
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  status: "PASS" | "FAIL";
}

// A student PASSes only if they were present and scored at least the passing marks in EVERY
// subject — absence in any one subject, or falling short of that subject's own passing mark, is
// an overall FAIL regardless of the aggregate percentage. This is a deliberate, documented
// default (not specified by the approved decisions) — the safer, more common school-system rule
// of "must clear every paper," not just the aggregate.
export function computeExamResultTotals(entries: MarksBreakdownInput[]): ComputedExamTotals {
  let totalMarksObtained = 0;
  let totalMaxMarks = 0;
  let allSubjectsPassed = true;

  for (const entry of entries) {
    totalMaxMarks += entry.maxMarks;
    const obtained = entry.isAbsent ? 0 : (entry.marksObtained ?? 0);
    totalMarksObtained += obtained;
    if (entry.isAbsent || obtained < entry.passingMarks) {
      allSubjectsPassed = false;
    }
  }

  const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

  return {
    totalMarksObtained,
    totalMaxMarks,
    percentage,
    status: allSubjectsPassed ? "PASS" : "FAIL",
  };
}
