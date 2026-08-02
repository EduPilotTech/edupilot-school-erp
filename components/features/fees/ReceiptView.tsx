import type { FeePaymentDTO } from "@/modules/fees/application/dto/fee-payment.dto";

export interface ReceiptLineItem {
  invoiceNumber: string;
  description: string;
  amount: number;
}

interface ReceiptContentProps {
  schoolName: string;
  schoolAddress: string;
  // Product Completion Phase 17 Bundle A — School Branding. Optional so every existing caller of
  // ReceiptView/ReceiptPrintView still type-checks without passing them.
  logoUrl?: string | null;
  footerText?: string | null;
  payment: FeePaymentDTO;
  studentName: string;
  admissionNumber: string;
  className: string;
  lineItems: ReceiptLineItem[];
}

function ReceiptContent({
  schoolName,
  schoolAddress,
  logoUrl,
  footerText,
  payment,
  studentName,
  admissionNumber,
  className,
  lineItems,
}: ReceiptContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
          <img src={logoUrl} alt="" className="mx-auto mb-1 h-10 w-10 object-contain" />
        )}
        <p className="text-lg font-semibold text-zinc-900">{schoolName}</p>
        <p className="text-xs text-zinc-500">{schoolAddress}</p>
      </div>
      <div className="border-t border-dashed border-zinc-300 pt-3 text-sm text-zinc-800">
        <p>
          Receipt No: <strong>{payment.receiptNumber}</strong>
        </p>
        <p>Date: {new Date(payment.paidAt).toLocaleString()}</p>
        <p>
          Student: {studentName} ({admissionNumber})
        </p>
        <p>Class: {className}</p>
        <p>Payment Mode: {payment.paymentMode}</p>
      </div>
      <table className="w-full border-t border-dashed border-zinc-300 pt-3 text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="pb-1">Invoice</th>
            <th className="pb-1">Description</th>
            <th className="pb-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-zinc-800">
          {lineItems.map((item) => (
            <tr key={item.invoiceNumber}>
              <td className="py-0.5">{item.invoiceNumber}</td>
              <td className="py-0.5">{item.description}</td>
              <td className="py-0.5 text-right">₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-dashed border-zinc-300 pt-3 text-right text-base font-semibold text-zinc-900">
        Total: ₹{payment.amount.toFixed(2)}
      </div>
      {payment.status === "REVERSED" && (
        <p className="text-center text-sm font-semibold text-red-600">
          REVERSED{payment.reversalReason ? `: ${payment.reversalReason}` : ""}
        </p>
      )}
      {payment.remarks && <p className="text-center text-xs text-zinc-500">{payment.remarks}</p>}
      {footerText && (
        <p className="border-t border-dashed border-zinc-300 pt-2 text-center text-xs text-zinc-400">
          {footerText}
        </p>
      )}
    </div>
  );
}

// Renders both an A4 area and an 80mm thermal area — the thermal area is `display: none` on
// screen (see receipt-print.css) and only shown when `document.documentElement.dataset.printMode`
// is set to "thermal" right before `window.print()` (see ReceiptPrintControls). Each area targets
// its own named `@page` (`a4-receipt` / `thermal-receipt`) for correct paper sizing, per Phase 8
// requirement 16 (A4 & Thermal receipt printing) reusing the existing print stack — no new
// libraries, per Decision 12.
export function ReceiptView(props: ReceiptContentProps) {
  return (
    <>
      <div id="receipt-a4-print-area" className="mx-auto w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-8">
        <ReceiptContent {...props} />
      </div>
      <div id="receipt-thermal-print-area" className="w-[80mm] bg-white p-2 text-xs">
        <ReceiptContent {...props} />
      </div>
    </>
  );
}
