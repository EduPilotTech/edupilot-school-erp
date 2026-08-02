import { LetterheadHeader, LetterheadFooter, type LetterheadBranding } from "@/components/features/branding/Letterhead";
import { BarcodeLabel } from "@/components/features/branding/BarcodeLabel";

export interface TransferCertificateFields {
  reasonForLeaving: string;
  dateOfLeaving: string;
  conduct: string;
  remarks: string;
}

interface TransferCertificateViewProps {
  branding: LetterheadBranding;
  studentName: string;
  admissionNumber: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  className: string;
  academicSessionName: string;
  admissionDate: string;
  fields: TransferCertificateFields;
}

// Completion Pass — Transfer Certificate branding (checklist #10). No new Prisma model — a
// Transfer Certificate has no persistent workflow anywhere in this codebase today (see this
// pass's own research: "TRANSFER_CERTIFICATE" previously existed only as a Student Documents
// upload slot for a scanned file, never something generated). This composes already-existing
// Student/Enrollment/School/Branding data with a small set of TC-specific fields captured at
// print time (see TransferCertificateForm) rather than inventing a new persisted entity —
// intentionally the smallest change that makes this a real, working, branded document.
export function TransferCertificateView({
  branding,
  studentName,
  admissionNumber,
  fatherName,
  motherName,
  dateOfBirth,
  className,
  academicSessionName,
  admissionDate,
  fields,
}: TransferCertificateViewProps) {
  return (
    <div id="transfer-certificate-print-area" className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8">
      <LetterheadHeader branding={branding} documentTitle="Transfer Certificate" />

      <div className="mt-4 flex items-start justify-between">
        <p className="text-xs text-zinc-500">TC No. {admissionNumber}-TC</p>
        <BarcodeLabel value={admissionNumber} height={32} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-zinc-500">Student Name</dt>
        <dd className="font-medium text-zinc-900">{studentName}</dd>
        <dt className="text-zinc-500">Admission Number</dt>
        <dd className="text-zinc-900">{admissionNumber}</dd>
        <dt className="text-zinc-500">Father&apos;s Name</dt>
        <dd className="text-zinc-900">{fatherName || "—"}</dd>
        <dt className="text-zinc-500">Mother&apos;s Name</dt>
        <dd className="text-zinc-900">{motherName || "—"}</dd>
        <dt className="text-zinc-500">Date of Birth</dt>
        <dd className="text-zinc-900">{dateOfBirth}</dd>
        <dt className="text-zinc-500">Class at Admission</dt>
        <dd className="text-zinc-900">{className}</dd>
        <dt className="text-zinc-500">Academic Session</dt>
        <dd className="text-zinc-900">{academicSessionName}</dd>
        <dt className="text-zinc-500">Date of Admission</dt>
        <dd className="text-zinc-900">{admissionDate}</dd>
        <dt className="text-zinc-500">Date of Leaving</dt>
        <dd className="text-zinc-900">{fields.dateOfLeaving || "—"}</dd>
        <dt className="text-zinc-500">Reason for Leaving</dt>
        <dd className="text-zinc-900">{fields.reasonForLeaving || "—"}</dd>
        <dt className="text-zinc-500">Conduct</dt>
        <dd className="text-zinc-900">{fields.conduct || "—"}</dd>
      </dl>

      {fields.remarks && (
        <p className="mt-4 text-sm text-zinc-700">
          <span className="font-medium text-zinc-500">Remarks: </span>
          {fields.remarks}
        </p>
      )}

      <p className="mt-6 text-sm text-zinc-700">
        This is to certify that the above information is true and correct as per the school records.
      </p>

      <LetterheadFooter branding={branding} signatureLabel="Principal" />
    </div>
  );
}
