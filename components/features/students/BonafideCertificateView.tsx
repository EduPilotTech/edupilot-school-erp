import { LetterheadHeader, LetterheadFooter, type LetterheadBranding } from "@/components/features/branding/Letterhead";
import { BarcodeLabel } from "@/components/features/branding/BarcodeLabel";

interface BonafideCertificateViewProps {
  branding: LetterheadBranding;
  studentName: string;
  admissionNumber: string;
  dateOfBirth: string;
  className: string;
  academicSessionName: string;
  purpose: string;
  issueDate: string;
}

// Completion Pass — Generic Certificate branding (checklist #11). Same "no new Prisma model,
// composed from already-existing data + a couple of print-time fields" shape as
// TransferCertificateView — a Bonafide Certificate ("this student is currently studying here")
// is the most common generic certificate an Indian school issues (for passport/bank/scholarship
// applications), and had zero prior implementation anywhere in this codebase.
export function BonafideCertificateView({
  branding,
  studentName,
  admissionNumber,
  dateOfBirth,
  className,
  academicSessionName,
  purpose,
  issueDate,
}: BonafideCertificateViewProps) {
  return (
    <div id="bonafide-certificate-print-area" className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8">
      <LetterheadHeader branding={branding} documentTitle="Bonafide Certificate" />

      <div className="mt-4 flex items-start justify-between">
        <p className="text-xs text-zinc-500">Issued: {issueDate}</p>
        <BarcodeLabel value={admissionNumber} height={32} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-800">
        This is to certify that <span className="font-semibold">{studentName}</span> (Admission No.{" "}
        <span className="font-semibold">{admissionNumber}</span>), born on{" "}
        <span className="font-semibold">{dateOfBirth}</span>, is a bonafide student of{" "}
        <span className="font-semibold">{branding.schoolName}</span>, currently studying in{" "}
        <span className="font-semibold">{className}</span> during the {academicSessionName} academic
        session.
      </p>

      {purpose && (
        <p className="mt-3 text-sm text-zinc-800">
          This certificate is issued for the purpose of <span className="font-semibold">{purpose}</span>.
        </p>
      )}

      <LetterheadFooter branding={branding} signatureLabel="Principal" />
    </div>
  );
}
