"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editStudentFormSchema, type EditStudentFormValues } from "./edit-student-form.schema";
import { updateStudentProfileAction } from "../actions";
import { EditStudentInfoSection } from "./edit-student-info-section";
import { EditAddressSection } from "./edit-address-section";
import { EditGuardianSection } from "./edit-guardian-section";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface EditStudentFormProps {
  profile: StudentProfileDTO;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function findGuardian(profile: StudentProfileDTO, relationship: "FATHER" | "MOTHER" | "GUARDIAN") {
  return profile.guardians.find((guardian) => guardian.relationship === relationship);
}

export function EditStudentForm({ profile }: EditStudentFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const father = findGuardian(profile, "FATHER");
  const mother = findGuardian(profile, "MOTHER");
  const localGuardian = findGuardian(profile, "GUARDIAN");

  const methods = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentFormSchema),
    defaultValues: {
      studentId: profile.student.id,
      student: {
        firstName: profile.student.firstName,
        lastName: profile.student.lastName,
        // "" is not a valid gender at the type level (deliberately, matching
        // admission-form.schema.ts's same cast) — a previously-admitted student should always
        // already have one set, so this is only a defensive fallback.
        gender: (profile.student.gender ?? "") as EditStudentFormValues["student"]["gender"],
        dateOfBirth: toDateInputValue(profile.student.dateOfBirth),
      },
      address: {
        address: profile.address.current.address ?? "",
        city: profile.address.current.city ?? "",
        state: profile.address.current.state ?? "",
        country: profile.address.current.country ?? "",
        postalCode: profile.address.current.postalCode ?? "",
      },
      guardians: {
        father: {
          fullName: father?.fullName ?? "",
          phone: father?.phone ?? "",
          occupation: father?.occupation ?? "",
        },
        mother: {
          fullName: mother?.fullName ?? "",
          phone: mother?.phone ?? "",
          occupation: mother?.occupation ?? "",
        },
        localGuardian: {
          fullName: localGuardian?.fullName ?? "",
          phone: localGuardian?.phone ?? "",
          occupation: localGuardian?.occupation ?? "",
        },
      },
    },
    mode: "onBlur",
  });

  async function onSubmit(values: EditStudentFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await updateStudentProfileAction(values);

      if (!result.success) {
        setSubmitError(result.error.message);
        return;
      }

      router.push(`/students/${result.data.studentId}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <EditStudentInfoSection admissionNumber={profile.student.admissionNumber} />
        <EditAddressSection />
        <EditGuardianSection
          slots={[
            { key: "father", label: "Father", hasExisting: !!father, isPrimary: !!father?.isPrimary },
            { key: "mother", label: "Mother", hasExisting: !!mother, isPrimary: !!mother?.isPrimary },
            {
              key: "localGuardian",
              label: "Local Guardian",
              hasExisting: !!localGuardian,
              isPrimary: !!localGuardian?.isPrimary,
            },
          ]}
        />

        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-6">
          <button
            type="button"
            onClick={() => router.push(`/students/${profile.student.id}`)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
