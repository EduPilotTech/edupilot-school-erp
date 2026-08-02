import "server-only";
import { jsPDF } from "jspdf";
import { InvalidPaymentTransitionError } from "../domain/errors";
import { getPayment } from "./payment.service";
import { getSubscriptionInvoice } from "./generate-subscription-invoice.service";
import {
  getPlatformCompanyAddress,
  getPlatformCompanyName,
  getPlatformGstin,
} from "../infrastructure/platform-billing-identity.env";
import type { PaymentDTO } from "./dto/payment.dto";
import type { PaymentStatusValue } from "../domain/payment.entity";
import type { SubscriptionInvoiceDTO } from "./dto/subscription-invoice.dto";

export interface PaymentReceiptBillTo {
  schoolName: string;
  address: string;
}

// A receipt only makes sense once money has actually moved — CREATED/AUTHORIZED/FAILED payments
// have nothing to receipt. PARTIALLY_REFUNDED/REFUNDED are still receiptable (money did move; the
// receipt shows the refund line, see renderReceiptPdf below).
const RECEIPTABLE_STATUSES: ReadonlySet<PaymentStatusValue> = new Set(["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"]);

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

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

// Deliberate design choice, not an oversight: unlike Subscription Invoice PDFs (which have a
// `storageKey` column and are generated once, then persisted/reused — see invoice-pdf.service.ts),
// PaymentEntity has no `storageKey` field, and this bundle must not add one without schema
// authorization (out of scope — no Prisma model changes here). A payment receipt is, however,
// fully deterministic from already-stored Payment + SubscriptionInvoice data: nothing about it
// can differ between two requests for the same payment. So rather than bolt on persistence this
// bundle isn't authorized to add, the receipt is simply rendered fresh on every request — a pure
// read-derived document, generated on demand, never written anywhere.
export async function generatePaymentReceipt(tenantId: string, paymentId: string, billTo: PaymentReceiptBillTo): Promise<Buffer> {
  const payment = await getPayment(tenantId, paymentId);
  if (!RECEIPTABLE_STATUSES.has(payment.status)) {
    throw new InvalidPaymentTransitionError("A receipt can only be generated for a captured payment.");
  }

  const invoice = await getSubscriptionInvoice(tenantId, payment.subscriptionInvoiceId);
  const platformIdentity = getPlatformIdentity();

  return renderReceiptPdf(platformIdentity, billTo, payment, invoice);
}

// A clean, simple single-page A4 receipt, in the same jsPDF conventions as invoice-pdf.service.ts
// / generate-employee-letter.service.ts (helvetica, same margin/heading style). No line-item
// table — a receipt just confirms what was received, it isn't a tax document.
function renderReceiptPdf(platform: PlatformIdentity, billTo: PaymentReceiptBillTo, payment: PaymentDTO, invoice: SubscriptionInvoiceDTO): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Payment Receipt", pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(platform.companyName, marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const supplierAddressLines = doc.splitTextToSize(platform.companyAddress, contentWidth / 2) as string[];
  doc.text(supplierAddressLines, marginX, y);
  y += supplierAddressLines.length * 5;
  doc.text(`GSTIN: ${platform.gstin}`, marginX, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Received From:", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(billTo.schoolName, marginX, y);
  y += 5;
  const billToAddressLines = doc.splitTextToSize(billTo.address, contentWidth / 2) as string[];
  doc.text(billToAddressLines, marginX, y);
  y += billToAddressLines.length * 5 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, marginX, y);
  doc.text(`Payment Date: ${payment.capturedAt ? formatDate(new Date(payment.capturedAt)) : "-"}`, pageWidth - marginX, y, {
    align: "right",
  });
  y += 6;
  doc.text(`Billing Period: ${invoice.billingPeriod}`, marginX, y);
  doc.text(`Payment Method: ${payment.method ?? "-"}`, pageWidth - marginX, y, { align: "right" });
  y += 6;
  doc.text(`Gateway Reference: ${payment.gatewayPaymentId ?? "-"}`, marginX, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Amount Paid: ${payment.currency} ${payment.amount.toFixed(2)}`, marginX, y);
  y += 8;

  if (payment.refundedAmount > 0) {
    const netRetained = payment.amount - payment.refundedAmount;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Refunded: ${payment.currency} ${payment.refundedAmount.toFixed(2)}`, marginX, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Net Amount Retained: ${payment.currency} ${netRetained.toFixed(2)}`, marginX, y);
    y += 8;
  }

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`For, ${platform.companyName}`, marginX, y);
  y += 20;
  doc.text("Authorized Signatory", marginX, y);

  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
