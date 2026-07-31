// Dependency-free CSV export — the `xlsx` package was deliberately removed from this project (its
// only npm-registry-published version carries two unpatched high-severity CVEs: prototype
// pollution and ReDoS), so "Export to Excel" across every Finance list/report page is implemented
// as a CSV file download instead (Excel opens `.csv` natively). Pure and reusable — every Finance
// page that needs a CSV export calls `downloadCsv` rather than re-implementing this.

// RFC 4180 §2.6: a field that contains a comma, a double quote, or a line break must be enclosed
// in double quotes, with any double quote inside it doubled.
function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsvString(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((line) => line.map(escapeCsvValue).join(","));
  // CRLF line endings, per RFC 4180 §2.2.
  return lines.join("\r\n");
}

// Triggers a client-side file download via a temporary <a> element — the same
// create-element-click-revoke pattern already used for PNG export in
// components/features/fees/ReceiptPrintControls.tsx's downloadDataUrl, adapted for a CSV Blob
// object URL instead of a data URL (a data URL would be impractically large for anything but a
// tiny report).
export function downloadCsv(fileName: string, headers: string[], rows: (string | number)[][]): void {
  const csv = toCsvString(headers, rows);
  // A leading UTF-8 BOM so Excel (which otherwise guesses the system codepage) renders non-ASCII
  // characters like the ₹ symbol correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
