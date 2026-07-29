import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { AdmissionFormValues } from "./admission-form.schema";
import { BLOOD_GROUP_OPTIONS } from "./admission-form.constants";

// Blood Group appears once, here — the brief listed it under both "Student Information" and
// "Medical," which would duplicate the same field twice in one form (a real UX antipattern, not
// something to replicate). Consolidated into Medical, where it sits naturally alongside
// Allergies/Medical Notes/Emergency Contact.
export function MedicalSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  return (
    <Card title="Medical">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Blood Group" htmlFor="medical.bloodGroup">
          <Select
            id="medical.bloodGroup"
            placeholder="Select blood group"
            options={BLOOD_GROUP_OPTIONS}
            {...register("medical.bloodGroup")}
          />
        </FormField>

        <FormField
          label="Emergency Contact"
          htmlFor="medical.emergencyContact"
          error={errors.medical?.emergencyContact?.message}
        >
          <Input
            id="medical.emergencyContact"
            type="tel"
            hasError={!!errors.medical?.emergencyContact}
            {...register("medical.emergencyContact")}
          />
        </FormField>

        <FormField label="Allergies" htmlFor="medical.allergies" hint="Comma-separated, if any">
          <Textarea id="medical.allergies" {...register("medical.allergies")} />
        </FormField>

        <FormField label="Medical Notes" htmlFor="medical.medicalNotes">
          <Textarea id="medical.medicalNotes" {...register("medical.medicalNotes")} />
        </FormField>
      </div>
    </Card>
  );
}
