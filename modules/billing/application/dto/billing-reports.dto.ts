import type { PaymentGatewayProviderCodeValue } from "../../domain/payment.entity";

// Platform-wide reports (EduPilot's own operational reports across every tenant) — composed by
// get-collection-report.service.ts / get-outstanding-report.service.ts /
// get-monthly-revenue-report.service.ts from direct cross-tenant `prisma` reads, mirroring
// billing-run.service.ts's own precedent for this module's platform-ops tier.

export interface CollectionReportDTO {
  fromDate: string;
  toDate: string;
  totalCollected: number;
  paymentCount: number;
  byGatewayProvider: {
    gatewayProvider: PaymentGatewayProviderCodeValue;
    amount: number;
    count: number;
  }[];
}

export interface OutstandingReportDTO {
  totalOutstanding: number;
  invoiceCount: number;
  // Ordered by outstandingAmount descending.
  byTenant: {
    tenantId: string;
    outstandingAmount: number;
    invoiceCount: number;
  }[];
}

export interface MonthlyRevenueReportDTO {
  year: number;
  // Always 12 entries (month 1-12), even for months with zero CAPTURED-payment activity.
  months: {
    month: number;
    revenue: number;
    paymentCount: number;
  }[];
}
