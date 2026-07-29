import type { FeePaymentModeValue } from "../../domain/fee-payment.entity";

export interface DailyCollectionReportRowDTO {
  paymentId: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMode: FeePaymentModeValue;
  collectedBy: string | null;
  paidAt: string;
}

export interface DailyCollectionReportDTO {
  date: string;
  totalCollected: number;
  totalsByMode: Record<FeePaymentModeValue, number>;
  rows: DailyCollectionReportRowDTO[];
}

export interface OutstandingDueRowDTO {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  totalOutstanding: number;
  overdueInvoiceCount: number;
}

export interface OutstandingDueReportDTO {
  academicSessionId: string;
  totalOutstanding: number;
  rows: OutstandingDueRowDTO[];
}

export interface ClassCollectionRowDTO {
  classId: string;
  className: string;
  totalCollected: number;
  totalOutstanding: number;
}

export interface ClassCollectionReportDTO {
  academicSessionId: string;
  rows: ClassCollectionRowDTO[];
}
