import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { EditStudentFormValues } from "./edit-student-form.schema";

interface GuardianSlotMeta {
  key: "father" | "mother" | "localGuardian";
  label: string;
  hasExisting: boolean;
  isPrimary: boolean;
}

interface EditGuardianSectionProps {
  slots: GuardianSlotMeta[];
}

// Three fixed slots, matching admission's own guardian structure (not a freeform add/remove
// list). A slot that already has a guardian on record cannot be cleared through this form —
// update-student-profile.service.ts rejects that server-side; the hint here just sets
// expectations before submit. Relationship/primary status are not editable here.
export function EditGuardianSection({ slots }: EditGuardianSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<EditStudentFormValues>();

  return (
    <Card title="Guardian Information">
      <div className="flex flex-col gap-6">
        {slots.map((slot) => (
          <div key={slot.key} className="rounded-lg border border-zinc-200 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-900">{slot.label}</h4>
              {slot.isPrimary && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Primary
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                label="Name"
                htmlFor={`guardians.${slot.key}.fullName`}
                required={slot.hasExisting}
                hint={slot.hasExisting ? "Cannot be cleared once set." : undefined}
                error={errors.guardians?.[slot.key]?.fullName?.message}
              >
                <Input
                  id={`guardians.${slot.key}.fullName`}
                  hasError={!!errors.guardians?.[slot.key]?.fullName}
                  {...register(`guardians.${slot.key}.fullName`)}
                />
              </FormField>

              <FormField label="Phone" htmlFor={`guardians.${slot.key}.phone`}>
                <Input
                  id={`guardians.${slot.key}.phone`}
                  type="tel"
                  {...register(`guardians.${slot.key}.phone`)}
                />
              </FormField>

              <FormField label="Occupation" htmlFor={`guardians.${slot.key}.occupation`}>
                <Input
                  id={`guardians.${slot.key}.occupation`}
                  {...register(`guardians.${slot.key}.occupation`)}
                />
              </FormField>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
