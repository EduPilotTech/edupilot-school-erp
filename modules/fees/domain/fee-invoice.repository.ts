import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeeInvoiceEntity, FeeInvoiceStatusValue } from "./fee-invoice.entity";

export interface CreateFeeInvoiceInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  feeCategoryId: string;
  // Phase 10 Decision 1 (extended by Phase 11, Phase 12): exactly one of these four is set —
  // feeStructureItemId for tuition/exam-type invoices, routeFeeRuleId for transport invoices,
  // hostelFeeRuleId for hostel invoices generated from a HostelFeeRule, bookIssueId for a
  // library fine invoice generated from a specific BookIssue incident.
  feeStructureItemId?: string | null;
  routeFeeRuleId?: string | null;
  hostelFeeRuleId?: string | null;
  bookIssueId?: string | null;
  installmentPlanId?: string | null;
  installmentNumber?: number | null;
  appliedConcessionId?: string | null;
  invoiceNumber: string;
  billingPeriod: string;
  amount: number;
  discountAmount?: number;
  taxAmount?: number | null;
  dueDate: Date;
  createdBy?: string | null;
}

export interface FeeInvoiceListFilter {
  academicSessionId?: string;
  classId?: string;
  status?: FeeInvoiceStatusValue;
}

// No generic `update` — every mutation is a named, business-meaningful transition
// (create/applyPayment/rollbackPayment/cancel), matching EnrollmentRepository's own
// "expose only the allowed mutations" discipline. Never a hard delete (Decision 10) — see `cancel`.
export interface FeeInvoiceRepository {
  findById(tenantId: string, id: string): Promise<FeeInvoiceEntity | null>;
  findByIds(tenantId: string, ids: string[]): Promise<FeeInvoiceEntity[]>;
  findByStudentAndItemAndPeriod(
    tenantId: string,
    studentId: string,
    feeStructureItemId: string,
    billingPeriod: string
  ): Promise<FeeInvoiceEntity | null>;
  // Phase 10 — the transport-billing analogue of findByStudentAndItemAndPeriod, used by
  // generateTransportInvoices for the same "already generated, don't duplicate" idempotency check.
  findByStudentAndRouteFeeRuleAndPeriod(
    tenantId: string,
    studentId: string,
    routeFeeRuleId: string,
    billingPeriod: string
  ): Promise<FeeInvoiceEntity | null>;
  // Phase 11 — the hostel-billing analogue, used by generateHostelMonthlyInvoices/
  // generateHostelOneTimeInvoice for the same idempotency check.
  findByStudentAndHostelFeeRuleAndPeriod(
    tenantId: string,
    studentId: string,
    hostelFeeRuleId: string,
    billingPeriod: string
  ): Promise<FeeInvoiceEntity | null>;
  // Phase 12 — at most one fine invoice per BookIssue incident (no billing period to key off of,
  // unlike the period-keyed lookups above), used by generateLibraryFineInvoice for the same
  // "already generated, don't duplicate" idempotency check.
  findByBookIssue(tenantId: string, bookIssueId: string): Promise<FeeInvoiceEntity | null>;
  findByStudent(tenantId: string, studentId: string, academicSessionId: string): Promise<FeeInvoiceEntity[]>;
  findMany(tenantId: string, filter: FeeInvoiceListFilter): Promise<FeeInvoiceEntity[]>;
  findOutstandingByStudent(tenantId: string, studentId: string): Promise<FeeInvoiceEntity[]>;

  create(input: CreateFeeInvoiceInput, tx?: Prisma.TransactionClient): Promise<FeeInvoiceEntity>;

  // Increments `amountPaid` by `amountApplied`, sets `status`, and — only the first time a
  // payment is collected against this invoice — snapshots `fineAmount` to `fineChargedNow`
  // (Decision 4: fines are computed lazily until the moment of collection). Must run inside the
  // caller's transaction (collect-payment.service.ts).
  applyPayment(
    tenantId: string,
    id: string,
    amountApplied: number,
    fineChargedNow: number,
    status: FeeInvoiceStatusValue,
    tx: Prisma.TransactionClient
  ): Promise<FeeInvoiceEntity>;

  // The inverse of applyPayment, used by reverse-payment.service.ts — decrements `amountPaid`
  // and resets `status`. Never touches `fineAmount` (the fine that was actually charged at
  // collection time remains part of the historical record even after a reversal).
  rollbackPayment(
    tenantId: string,
    id: string,
    amountToRollback: number,
    status: FeeInvoiceStatusValue,
    tx: Prisma.TransactionClient
  ): Promise<FeeInvoiceEntity>;

  cancel(
    tenantId: string,
    id: string,
    cancelledBy: string | null,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<FeeInvoiceEntity>;
}
