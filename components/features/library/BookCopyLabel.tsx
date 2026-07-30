import QRCode from "react-qr-code";
import Barcode from "react-barcode";

interface BookCopyLabelProps {
  accessionNumber: string;
}

// Reuses the existing QR package (react-qr-code, already a dependency for student ID cards) plus
// react-barcode for Code128 — both rendered directly from the copy's own accessionNumber, the
// single canonical identifier. Neither is a separately stored field (see BookCopyEntity's own
// comment) — both are generated automatically here at label render time.
export function BookCopyLabel({ accessionNumber }: BookCopyLabelProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3">
      <div style={{ width: "56px", height: "56px" }} data-testid="book-copy-qr">
        <QRCode value={accessionNumber} size={256} style={{ height: "100%", width: "100%" }} viewBox="0 0 256 256" />
      </div>
      <div data-testid="book-copy-barcode">
        <Barcode value={accessionNumber} format="CODE128" height={40} width={1.4} fontSize={11} margin={4} />
      </div>
    </div>
  );
}
