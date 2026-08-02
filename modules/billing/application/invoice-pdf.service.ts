import "server-only";
import { jsPDF } from "jspdf";
import { PLATFORM_INVOICES_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaSubscriptionInvoiceRepository } from "../infrastructure/prisma-subscription-invoice.repository";
import {
  getPlatformCompanyAddress,
  getPlatformCompanyName,
  getPlatformGstin,
} from "../infrastructure/platform-billing-identity.env";
import { SubscriptionInvoiceNotFoundError } from "../domain/errors";
import { computeGstBreakdown, type GstBreakdown } from "./gst-calculation.helpers";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { toSubscriptionInvoiceDTO } from "./generate-subscription-invoice.service";
import type { SubscriptionInvoiceDTO } from "./dto/subscription-invoice.dto";
import type { SubscriptionInvoiceEntity } from "../domain/subscription-invoice.entity";
import type { BillingContext } from "./billing-context";

// Indian GST tax invoices conventionally show an HSN/SAC classification code. "998319" is the
// real SAC code for "Other information technology services" — the correct category for a SaaS
// subscription — not a made-up placeholder.
const IT_SERVICES_HSN_SAC_CODE = "998319";

export interface InvoicePdfBillTo {
  schoolName: string;
  address: string;
}

// Mirrors GenerateEmployeeLetterContext's own precedent (modules/hr/application/
// generate-employee-letter.service.ts): the tenant's school info for the "bill to" section is
// passed in by the caller (a Server Component/Action already holding `getCurrentSchool()`), not
// re-fetched by this service.
export interface InvoicePdfContext extends BillingContext {
  billTo: InvoicePdfBillTo;
}

export interface GenerateInvoicePdfOptions {
  includeGst: boolean;
  gstRatePercent?: number;
  isInterState?: boolean;
}

interface PlatformIdentity {
  companyName: string;
  companyAddress: string;
  gstin: string;
}

function getPlatformIdentity(): PlatformIdentity {
  return {
    companyName: getPlatformCompanyName(),
    companyAddress: getPlatformCompanyAddress(),
    gstin: getPlatformGstin(),
  };
}

// Reuses the exact sanitization regex idiom as buildEmployeeDocumentStorageKey (modules/hr/
// application/employee-document-storage.helpers.ts) — never invent a new one for the same
// purpose.
function sanitizeForStorageKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

const invoiceRepository = new PrismaSubscriptionInvoiceRepository();

// Loads the SubscriptionInvoice, renders it (as a GST-compliant Tax Invoice or a plain invoice
// depending on `options.includeGst`), uploads the PDF to the platform-invoices bucket, and
// persists the resulting storage key — mirrors generateEmployeeLetter's own
// render-then-upload-then-persist flow, including its "upload succeeds, then the DB write can
// still fail — clean up the orphaned upload" discipline.
export async function generateInvoicePdf(
  tenantId: string,
  invoiceId: string,
  options: GenerateInvoicePdfOptions,
  context: InvoicePdfContext
): Promise<SubscriptionInvoiceDTO> {
  const invoice = await invoiceRepository.findById(tenantId, invoiceId);
  if (!invoice) {
    throw new SubscriptionInvoiceNotFoundError();
  }

  const platformIdentity = getPlatformIdentity();
  const breakdown = options.includeGst
    ? computeGstBreakdown(invoice.amount, options.gstRatePercent ?? 18, options.isInterState ?? false)
    : null;

  const pdfBuffer = renderInvoicePdf(platformIdentity, context.billTo, invoice, breakdown);

  const sanitizedInvoiceNumber = sanitizeForStorageKey(invoice.invoiceNumber);
  const storageKey = `${tenantId}/invoices/${sanitizedInvoiceNumber}.pdf`;
  const storage = new SupabaseStorageService();

  await storage.upload({
    bucket: PLATFORM_INVOICES_BUCKET,
    key: storageKey,
    file: pdfBuffer,
    contentType: "application/pdf",
  });

  try {
    const updated = await invoiceRepository.updateStorageKey(tenantId, invoiceId, storageKey);

    await recordPlatformAudit({
      tenantId,
      actorId: context.actingUserId,
      action: "INVOICE_PDF_GENERATED",
      entityType: "SubscriptionInvoice",
      entityId: updated.id,
      afterState: updated,
    });

    return toSubscriptionInvoiceDTO(updated);
  } catch (error) {
    await storage.delete(PLATFORM_INVOICES_BUCKET, storageKey).catch(() => {});
    throw error;
  }
}

interface TableColumn {
  header: string;
  width: number;
}

// Hand-drawn table (rect + text) since this codebase has no jspdf-autotable dependency — mirrors
// renderLetterPdf's own plain jsPDF text-API approach, just extended with simple cell borders.
function drawTableHeader(doc: jsPDF, marginX: number, y: number, columns: TableColumn[]): number {
  const rowHeight = 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  let x = marginX;
  for (const col of columns) {
    doc.rect(x, y, col.width, rowHeight);
    doc.text(col.header, x + 2, y + rowHeight - 2.5);
    x += col.width;
  }
  return y + rowHeight;
}

function drawTableRow(doc: jsPDF, marginX: number, y: number, columns: TableColumn[], values: string[], rowHeight = 10): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let x = marginX;
  for (let i = 0; i < columns.length; i += 1) {
    const col = columns[i];
    doc.rect(x, y, col.width, rowHeight);
    const lines = doc.splitTextToSize(values[i] ?? "", col.width - 4) as string[];
    doc.text(lines, x + 2, y + 4);
    x += col.width;
  }
  return y + rowHeight;
}

// Builds a clean, single-page A4 invoice PDF server-side with jsPDF's text/shape APIs (no
// html2canvas — that is browser-only), in the same visual style as
// generate-employee-letter.service.ts's own renderLetterPdf (helvetica, same margin/heading
// conventions). When `breakdown` is present this renders a GST-compliant "Tax Invoice" with
// supplier GSTIN, HSN/SAC code, and a CGST/SGST/IGST line-item table; otherwise it renders a
// simpler plain invoice with just the total.
function renderInvoicePdf(
  platform: PlatformIdentity,
  billTo: InvoicePdfBillTo,
  invoice: SubscriptionInvoiceEntity,
  breakdown: GstBreakdown | null
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(breakdown ? "Tax Invoice" : "Invoice", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Supplier block (the platform itself).
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(platform.companyName, marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const supplierAddressLines = doc.splitTextToSize(platform.companyAddress, contentWidth / 2) as string[];
  doc.text(supplierAddressLines, marginX, y);
  y += supplierAddressLines.length * 5;
  if (breakdown) {
    doc.text(`GSTIN: ${platform.gstin}`, marginX, y);
    y += 5;
    doc.text(`HSN/SAC: ${IT_SERVICES_HSN_SAC_CODE}`, marginX, y);
    y += 5;
  }
  y += 6;

  // Recipient block (the tenant school).
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To:", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(billTo.schoolName, marginX, y);
  y += 5;
  const billToAddressLines = doc.splitTextToSize(billTo.address, contentWidth / 2) as string[];
  doc.text(billToAddressLines, marginX, y);
  y += billToAddressLines.length * 5 + 8;

  // Invoice meta.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, marginX, y);
  doc.text(`Invoice Date: ${formatDate(invoice.issuedAt ?? new Date())}`, pageWidth - marginX, y, { align: "right" });
  y += 6;
  doc.text(`Billing Period: ${invoice.billingPeriod}`, marginX, y);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - marginX, y, { align: "right" });
  y += 10;

  const description = `${invoice.planAtInvoice} Plan Subscription — ${invoice.billingPeriod}`;

  if (breakdown) {
    const columns: TableColumn[] = [
      { header: "Description", width: contentWidth * 0.34 },
      { header: "Taxable Value", width: contentWidth * 0.16 },
      { header: "CGST", width: contentWidth * 0.13 },
      { header: "SGST", width: contentWidth * 0.13 },
      { header: "IGST", width: contentWidth * 0.12 },
      { header: "Total", width: contentWidth * 0.12 },
    ];
    y = drawTableHeader(doc, marginX, y, columns);
    y = drawTableRow(doc, marginX, y, columns, [
      description,
      `${invoice.currency} ${breakdown.taxableAmount.toFixed(2)}`,
      breakdown.cgst.toFixed(2),
      breakdown.sgst.toFixed(2),
      breakdown.igst.toFixed(2),
      `${invoice.currency} ${breakdown.totalWithTax.toFixed(2)}`,
    ]);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Tax: ${invoice.currency} ${breakdown.totalTax.toFixed(2)}`, pageWidth - marginX, y, { align: "right" });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount Payable: ${invoice.currency} ${breakdown.totalWithTax.toFixed(2)}`, pageWidth - marginX, y, { align: "right" });
    y += 14;
  } else {
    const columns: TableColumn[] = [
      { header: "Description", width: contentWidth * 0.7 },
      { header: "Amount", width: contentWidth * 0.3 },
    ];
    y = drawTableHeader(doc, marginX, y, columns);
    y = drawTableRow(doc, marginX, y, columns, [description, `${invoice.currency} ${invoice.totalAmount.toFixed(2)}`]);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total Amount Payable: ${invoice.currency} ${invoice.totalAmount.toFixed(2)}`, pageWidth - marginX, y, { align: "right" });
    y += 14;
  }

  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`For, ${platform.companyName}`, marginX, y);
  y += 20;
  doc.text("Authorized Signatory", marginX, y);

  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
