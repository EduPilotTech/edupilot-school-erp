// Pure, no "server-only" import — deliberately unit-testable in isolation (see
// docs/CODING_STANDARDS.md §7 on preferring pure functions where the logic allows it).
export interface PeriodValidationInput {
  periodNumber: number;
  startTime: Date;
  endTime: Date;
}

// Returns an error message if the period list is invalid, or null if it's valid. Checks:
// unique period numbers, each period's start before its own end, and no two periods overlapping
// in time regardless of declared order.
export function validatePeriods(periods: PeriodValidationInput[]): string | null {
  const seenNumbers = new Set<number>();
  for (const period of periods) {
    if (seenNumbers.has(period.periodNumber)) {
      return `Period number ${period.periodNumber} is duplicated.`;
    }
    seenNumbers.add(period.periodNumber);
    if (period.startTime.getTime() >= period.endTime.getTime()) {
      return `Period ${period.periodNumber}'s start time must be before its end time.`;
    }
  }

  const sorted = [...periods].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].startTime.getTime() < sorted[i - 1].endTime.getTime()) {
      return `Period ${sorted[i].periodNumber} overlaps with period ${sorted[i - 1].periodNumber}.`;
    }
  }

  return null;
}
