// Platform-ops — global vendor invoice-numbering counter, scoped by financial year, NOT by
// tenant (a single sequential series across every tenant, the normal expectation for
// statutory/GST invoice numbering — see the schema's own comment).
export interface PlatformInvoiceSequenceEntity {
  id: string;
  financialYear: string;
  prefix: string;
  lastNumber: number;
  updatedAt: Date;
  updatedBy: string | null;
}
