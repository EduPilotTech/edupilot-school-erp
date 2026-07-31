// The single Finance Dashboard read model (Phase 14 spec §5).
export interface FinanceDashboardDTO {
  todaysIncome: number;
  todaysExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  currentCashBalance: number;
  currentBankBalance: number;
}
