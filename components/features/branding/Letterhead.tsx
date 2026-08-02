// Completion Pass — Letterhead branding (checklist #12). A shared header/footer pair for the
// documents built fresh in this pass (Fee Invoice, Transfer Certificate, Bonafide Certificate,
// Salary Slip) — NOT retrofitted into the already-shipped, already-verified ID Card/Receipt/
// Report Card (each of those keeps its own bespoke layout; redesigning them was explicitly out
// of scope). Deliberately plain, print-safe markup (no client JS) since every consumer already
// owns its own print/export controls (TimetablePrintControls, ReceiptPrintControls, etc.).
export interface LetterheadBranding {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  themeColor: string | null;
  headerText: string | null;
  footerText: string | null;
  signatureUrl: string | null;
  sealUrl: string | null;
}

interface LetterheadHeaderProps {
  branding: LetterheadBranding;
  documentTitle: string;
}

export function LetterheadHeader({ branding, documentTitle }: LetterheadHeaderProps) {
  const color = branding.themeColor || "#1D4ED8";
  return (
    <div className="border-b-2 pb-3" style={{ borderColor: color }}>
      <div className="flex items-center gap-3">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
          <img src={branding.logoUrl} alt="" className="h-12 w-12 object-contain" />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {branding.schoolName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-lg font-semibold text-zinc-900">{branding.schoolName}</p>
          {branding.headerText && <p className="text-xs text-zinc-500">{branding.headerText}</p>}
          <p className="text-xs text-zinc-500">
            {branding.address} · {branding.phone} · {branding.email}
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-700">
        {documentTitle}
      </p>
    </div>
  );
}

interface LetterheadFooterProps {
  branding: LetterheadBranding;
  signatureLabel?: string;
}

export function LetterheadFooter({ branding, signatureLabel = "Authorized Signatory" }: LetterheadFooterProps) {
  return (
    <div className="mt-6 flex items-end justify-between border-t border-zinc-200 pt-3">
      <p className="max-w-xs text-xs text-zinc-400">{branding.footerText}</p>
      <div className="flex items-end gap-3">
        {branding.sealUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
          <img src={branding.sealUrl} alt="School seal" className="h-14 w-14 object-contain opacity-90" />
        )}
        <div className="flex flex-col items-center">
          {branding.signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL from Supabase Storage.
            <img src={branding.signatureUrl} alt="Signature" className="h-10 w-24 object-contain" />
          )}
          <p className="w-32 border-t border-zinc-300 pt-1 text-center text-xs text-zinc-500">
            {signatureLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
