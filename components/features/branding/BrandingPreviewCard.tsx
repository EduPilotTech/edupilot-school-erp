interface BrandingPreviewCardProps {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  sealUrl: string | null;
  headerText: string;
  footerText: string;
  themeColor: string;
  motto: string;
}

const DEFAULT_THEME_COLOR = "#1D4ED8";

// A live letterhead mockup — reflects the Manager's in-progress form state (not just the last
// saved branding), so "Preview support" means what an admin types, not what they already saved.
// Deliberately plain, print-document-shaped markup (not a reused print component) — this bundle's
// "Do NOT redesign any existing module" instruction means the actual print components (ID Card,
// Receipt, Report Card) keep their own layouts; this preview is a new, dedicated surface that
// exists only to show what the configured branding will look like.
export function BrandingPreviewCard({
  schoolName,
  address,
  phone,
  email,
  logoUrl,
  signatureUrl,
  sealUrl,
  headerText,
  footerText,
  themeColor,
  motto,
}: BrandingPreviewCardProps) {
  const color = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(themeColor) ? themeColor : DEFAULT_THEME_COLOR;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 text-white" style={{ backgroundColor: color }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL preview.
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-full bg-white object-contain" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-white/30" />
        )}
        <div>
          <p className="text-lg font-semibold leading-tight">{schoolName}</p>
          {headerText && <p className="text-xs leading-tight text-white/90">{headerText}</p>}
        </div>
      </div>

      <div className="space-y-2 px-6 py-4 text-sm text-zinc-700">
        {motto && <p className="italic text-zinc-500">&ldquo;{motto}&rdquo;</p>}
        <p className="text-xs text-zinc-500">{address}</p>
        <p className="text-xs text-zinc-500">
          {phone} · {email}
        </p>

        <div className="flex items-end justify-between border-t border-dashed border-zinc-200 pt-3">
          <div className="text-xs text-zinc-400">
            {footerText || "Footer text will appear here on printed documents."}
          </div>
          <div className="flex items-center gap-3">
            {signatureUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL preview.
              <img src={signatureUrl} alt="Principal signature" className="h-8 w-16 object-contain" />
            )}
            {sealUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL preview.
              <img src={sealUrl} alt="School seal" className="h-10 w-10 object-contain" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
