// Phase 13 spec §12 — the single HR Dashboard read model.
export interface HrDashboardDTO {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  payrollPending: number;
  salaryPaid: number;
  salaryDue: number;
}
