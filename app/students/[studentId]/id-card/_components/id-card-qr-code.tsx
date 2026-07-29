import QRCode from "react-qr-code";

interface IdCardQrCodeProps {
  value: string;
  sizeMm?: number;
}

// Thin wrapper around react-qr-code (pure SVG, no canvas — scales cleanly for both screen
// preview and print/export at any size). `value` is the student's raw UUID (see
// modules/students/application/dto/student-id-card.dto.ts's comment on why).
export function IdCardQrCode({ value, sizeMm = 18 }: IdCardQrCodeProps) {
  return (
    <div style={{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }} data-testid="id-card-qr-code">
      <QRCode
        value={value}
        size={256}
        style={{ height: "100%", width: "100%" }}
        viewBox="0 0 256 256"
      />
    </div>
  );
}
