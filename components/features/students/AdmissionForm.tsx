"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admitStudentAction } from "@/app/students/new/actions";
import {
  admissionFormSchema,
  admissionFormDefaultValues,
  type AdmissionFormValues,
} from "./admission-form.schema";
import type { AcademicOptions } from "./admission-form.types";
import { StudentInformationSection } from "./StudentInformationSection";
import { AcademicInformationSection } from "./AcademicInformationSection";
import { GuardianInformationSection } from "./GuardianInformationSection";
import { AddressSection } from "./AddressSection";
import { TransportSection } from "./TransportSection";
import { HostelSection } from "./HostelSection";
import { MedicalSection } from "./MedicalSection";
import { UploadsSection } from "./UploadsSection";
import { DeclarationSection } from "./DeclarationSection";

interface AdmissionFormProps {
  academicOptions: AcademicOptions;
}

// No backend exists yet for this form (Sprint 4 — Step 3: "no repository calls, no server
// action, no database"). Both submit handlers below are the one necessary placeholder this
// step's own constraints require — a submit button has to do *something* — and are the explicit
// integration point for modules/students/application's future admit-student Server Action
// (Sprint 4 — Step 4 or later), not a TODO sprinkled without purpose.
//
// "Save Draft" deliberately does NOT go through handleSubmit()/the Zod schema at all: a draft is
// incomplete by definition, so it must never be blocked by required-field or declaration rules
// that only make sense for a final submission. It reads current form state directly instead.
export function AdmissionForm({ academicOptions }: AdmissionFormProps) {
  const router = useRouter();
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: admissionFormDefaultValues,
    mode: "onBlur",
  });

  function handleSaveDraft() {
    const draftValues = methods.getValues();
    console.log("Admission draft captured (no backend yet):", draftValues);
    setSubmitError(null);
    setSubmitMessage("Draft captured locally — nothing is saved yet (no backend this sprint).");
  }

  async function onSubmitAdmission(values: AdmissionFormValues) {
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const result = await admitStudentAction(values);

      if (!result.success) {
        setSubmitError(result.error.message);
        return;
      }

      setSubmitMessage(`Admission successful — admission number ${result.data.admissionNumber}.`);
      router.push("/students");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmitAdmission)}
        noValidate
        className="flex flex-col gap-6"
      >
        <StudentInformationSection />
        <AcademicInformationSection options={academicOptions} />
        <GuardianInformationSection />
        <AddressSection />
        <TransportSection />
        <HostelSection />
        <MedicalSection />
        <UploadsSection />
        <DeclarationSection />

        {submitMessage && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            {submitMessage}
          </p>
        )}

        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-6">
          <button
            type="button"
            onClick={() => router.push("/students")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit Admission"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
