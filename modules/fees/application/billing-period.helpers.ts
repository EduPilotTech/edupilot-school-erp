// "YYYY-MM" is the canonical FeeInvoice.billingPeriod string for monthly invoices — a plain
// string rather than a Date, since one-time/installment invoices have no natural month.
export function computeMonthlyDueDate(billingPeriod: string, dueDayOfMonth: number | null): Date {
  const [yearStr, monthStr] = billingPeriod.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = dueDayOfMonth ?? 10;
  return new Date(Date.UTC(year, month - 1, day));
}

export function computeInstallmentDueDate(sessionStartDate: Date, dueDayOffset: number): Date {
  const due = new Date(sessionStartDate);
  due.setUTCDate(due.getUTCDate() + dueDayOffset);
  return due;
}
