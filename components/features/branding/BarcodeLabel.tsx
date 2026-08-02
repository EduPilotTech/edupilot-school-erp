"use client";

import Barcode from "react-barcode";

interface BarcodeLabelProps {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
}

// Completion Pass — QR & Barcode support (checklist #13). `react-barcode` was already a
// dependency, already wired into the Library module (components/features/library/
// BookCopyLabel.tsx, CODE128) — this is the same library reused for the two new documents this
// pass adds (Transfer Certificate, Bonafide Certificate), not a new dependency.
export function BarcodeLabel({ value, height = 40, width = 1.4, fontSize = 11 }: BarcodeLabelProps) {
  return <Barcode value={value} format="CODE128" height={height} width={width} fontSize={fontSize} margin={4} />;
}
