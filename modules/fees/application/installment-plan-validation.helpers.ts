export interface InstallmentPlanItemInput {
  installmentNumber: number;
  percentageOfTotal: number;
  dueDayOffset: number;
}

// Mirrors grade-band-validation.helpers.ts's shape: a pure function returning a message string on
// failure, null on success.
export function validateInstallmentPlanItems(items: InstallmentPlanItemInput[]): string | null {
  if (items.length === 0) return "At least one installment is required.";

  const numbers = [...items.map((item) => item.installmentNumber)].sort((a, b) => a - b);
  for (let i = 0; i < numbers.length; i += 1) {
    if (numbers[i] !== i + 1) {
      return "Installment numbers must be sequential starting from 1.";
    }
  }

  const totalPercentage = items.reduce((sum, item) => sum + item.percentageOfTotal, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return "Installment percentages must add up to 100%.";
  }

  return null;
}
