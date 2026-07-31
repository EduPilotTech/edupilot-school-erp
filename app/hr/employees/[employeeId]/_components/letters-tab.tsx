"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateEmployeeLetterAction, listEmployeeDocumentsAction } from "@/app/hr/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { EmployeeLetterDocumentType } from "@/modules/hr/application/dto/employee-document.dto";

interface LettersTabProps {
  employeeId: string;
}

interface GeneratedLetter {
  id: string;
  documentType: EmployeeLetterDocumentType;
  generatedAt: string;
  signedUrl: string | null;
}

const LETTER_TYPE_OPTIONS: { value: EmployeeLetterDocumentType; label: string }[] = [
  { value: "APPOINTMENT_LETTER", label: "Appointment Letter" },
  { value: "JOINING_LETTER", label: "Joining Letter" },
  { value: "PROMOTION_LETTER", label: "Promotion Letter" },
  { value: "WARNING_LETTER", label: "Warning Letter" },
  { value: "EXPERIENCE_CERTIFICATE", label: "Experience Certificate" },
  { value: "RELIEVING_LETTER", label: "Relieving Letter" },
];

const LETTER_TYPE_LABELS: Record<EmployeeLetterDocumentType, string> = Object.fromEntries(
  LETTER_TYPE_OPTIONS.map((option) => [option.value, option.label])
) as Record<EmployeeLetterDocumentType, string>;

// Generates the 6 letter/certificate types via generateEmployeeLetterAction. The generated
// EmployeeDocument shares the same `documentType` vocabulary as uploaded documents (see
// documents-tab.tsx's own comment), so it also appears in the Documents tab automatically once
// router.refresh() re-runs the page's listEmployeeDocuments call — this tab additionally keeps a
// small local "generated this session" list (with a fetched signedUrl for an immediate download
// link) since generateEmployeeLetterAction's own return value (EmployeeDocumentDTO) doesn't carry
// a signedUrl.
export function LettersTab({ employeeId }: LettersTabProps) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<EmployeeLetterDocumentType>("APPOINTMENT_LETTER");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [relievingDate, setRelievingDate] = useState("");
  const [newDesignationName, setNewDesignationName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLetters, setGeneratedLetters] = useState<GeneratedLetter[]>([]);

  const needsRelievingDate = documentType === "EXPERIENCE_CERTIFICATE" || documentType === "RELIEVING_LETTER";
  const needsDesignationName = documentType === "PROMOTION_LETTER";

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateEmployeeLetterAction({
        employeeId,
        documentType,
        effectiveDate: effectiveDate || undefined,
        relievingDate: needsRelievingDate && relievingDate ? relievingDate : undefined,
        newDesignationName: needsDesignationName && newDesignationName ? newDesignationName : undefined,
        remarks: remarks || undefined,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      const generatedId = result.data.id;
      let signedUrl: string | null = null;
      const documentsResult = await listEmployeeDocumentsAction(employeeId);
      if (documentsResult.success) {
        signedUrl = documentsResult.data.find((doc) => doc.id === generatedId)?.signedUrl ?? null;
      }

      setGeneratedLetters((prev) => [
        {
          id: generatedId,
          documentType: result.data.documentType as EmployeeLetterDocumentType,
          generatedAt: result.data.createdAt.toLocaleString(),
          signedUrl,
        },
        ...prev,
      ]);

      setEffectiveDate("");
      setRelievingDate("");
      setNewDesignationName("");
      setRemarks("");
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Generate Letter" description="Appointment, joining, promotion, and warning letters, plus experience and relieving certificates.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Letter Type" htmlFor="letter-type" required>
              <Select
                id="letter-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as EmployeeLetterDocumentType)}
                options={LETTER_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Effective / Issued Date" htmlFor="letter-effective-date" hint="Defaults to today">
              <Input
                id="letter-effective-date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </FormField>
            {needsRelievingDate && (
              <FormField
                label="Relieving Date"
                htmlFor="letter-relieving-date"
                hint={documentType === "EXPERIENCE_CERTIFICATE" ? "Optional — omit for 'employed to present'" : undefined}
              >
                <Input
                  id="letter-relieving-date"
                  type="date"
                  value={relievingDate}
                  onChange={(e) => setRelievingDate(e.target.value)}
                />
              </FormField>
            )}
            {needsDesignationName && (
              <FormField label="New Designation" htmlFor="letter-new-designation" required>
                <Input
                  id="letter-new-designation"
                  value={newDesignationName}
                  onChange={(e) => setNewDesignationName(e.target.value)}
                  placeholder="Senior Teacher"
                />
              </FormField>
            )}
          </div>

          <FormField label="Remarks" htmlFor="letter-remarks" hint="Optional — e.g. the cited reason on a warning letter">
            <Textarea id="letter-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </FormField>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

          <div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (needsDesignationName && !newDesignationName)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      </Card>

      {generatedLetters.length > 0 && (
        <Card title="Generated This Session">
          <ul className="flex flex-col gap-2">
            {generatedLetters.map((letter) => (
              <li
                key={letter.id}
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm"
              >
                <span className="text-emerald-800">
                  {LETTER_TYPE_LABELS[letter.documentType]} generated at {letter.generatedAt}
                </span>
                {letter.signedUrl && (
                  <a href={letter.signedUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
