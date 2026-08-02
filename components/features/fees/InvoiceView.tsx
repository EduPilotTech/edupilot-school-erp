import QRCode from "react-qr-code";
import { LetterheadHeader, LetterheadFooter, type LetterheadBranding } from "@/components/features/branding/Letterhead";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

interface InvoiceViewProps {
  invoice: FeeInvoiceDTO;
  branding: LetterheadBranding;
  studentName: string;
  admissionNumber: string;
  className: string;
  lineItems: InvoiceLineItem[];
}

// Completion Pass — Invoice branding (checklist #8). The GST/subscription invoice
// (modules/billing/application/invoice-pdf.service.ts) is EduPilot billing THE SCHOOL — the
// school's own logo has no legitimate place there (see this pass's own research: the seller
// identity in that document is the platform, not the tenant). This is the document a school
// actually issues to a parent — no PDF/print view existed for FeeInvoice anywhere before this
// pass (only the Payment Receipt did, wired in the original Bundle A pass).
export function InvoiceView({ invoice, branding, studentName, admissionNumber, className, lineItems }: InvoiceViewProps) {
  return (
    <div id="fee-invoice-print-area" className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8">
      <LetterheadHeader branding={branding} documentTitle="Fee Invoice" />

      <div className="mt-4 flex items-start justify-between">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <dt className="text-zinc-500">Invoice No.</dt>
          <dd className="font-medium text-zinc-900">{invoice.invoiceNumber}</dd>
          <dt className="text-zinc-500">Billing Period</dt>
          <dd className="text-zinc-900">{invoice.billingPeriod}</dd>
          <dt className="text-zinc-500">Due Date</dt>
          <dd className="text-zinc-900">{invoice.dueDate}</dd>
          <dt className="text-zinc-500">Student</dt>
          <dd className="text-zinc-900">
            {studentName} ({admissionNumber})
          </dd>
          <dt className="text-zinc-500">Class</dt>
          <dd className="text-zinc-900">{className}</dd>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium text-zinc-900">{invoice.status}</dd>
        </dl>
        <div className="flex flex-col items-center gap-1">
          <QRCode value={invoice.invoiceNumber} size={72} />
          <p className="text-[10px] text-zinc-400">Scan to verify</p>
        </div>
      </div>

      <table className="mt-6 w-full border-t border-zinc-200 pt-3 text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="border-b border-zinc-200 pb-1">Description</th>
            <th className="border-b border-zinc-200 pb-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-zinc-800">
          {lineItems.map((item) => (
            <tr key={item.description}>
              <td className="py-1.5">{item.description}</td>
              <td className="py-1.5 text-right">₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
          {invoice.discountAmount > 0 && (
            <tr>
              <td className="py-1.5">Discount</td>
              <td className="py-1.5 text-right">-₹{invoice.discountAmount.toFixed(2)}</td>
            </tr>
          )}
          {invoice.fineAmount > 0 && (
            <tr>
              <td className="py-1.5">Late Fine</td>
              <td className="py-1.5 text-right">₹{invoice.fineAmount.toFixed(2)}</td>
            </tr>
          )}
          {invoice.amountPaid > 0 && (
            <tr>
              <td className="py-1.5">Amount Paid</td>
              <td className="py-1.5 text-right">-₹{invoice.amountPaid.toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 border-t border-zinc-200 pt-3 text-right text-base font-semibold text-zinc-900">
        Balance Due: ₹{invoice.balance.toFixed(2)}
      </div>

      <LetterheadFooter branding={branding} signatureLabel="Authorized Signatory" />
    </div>
  );
}
