import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdmissionFormValues } from "./admission-form.schema";
import { LOCAL_GUARDIAN_RELATION_OPTIONS } from "./admission-form.constants";

// Father/Mother/Local Guardian are all optional at the field level (Sprint 4 — Step 1 flagged
// "should a student ever be left with zero guardians" as an explicitly open question, not
// resolved — so no "at least one guardian" rule is imposed here either).
export function GuardianInformationSection() {
  const { register } = useFormContext<AdmissionFormValues>();

  return (
    <Card title="Guardian Information">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-600">Father</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Name" htmlFor="guardians.father.name">
              <Input id="guardians.father.name" {...register("guardians.father.name")} />
            </FormField>
            <FormField label="Mobile" htmlFor="guardians.father.mobile">
              <Input
                id="guardians.father.mobile"
                type="tel"
                {...register("guardians.father.mobile")}
              />
            </FormField>
            <FormField label="Occupation" htmlFor="guardians.father.occupation">
              <Input
                id="guardians.father.occupation"
                {...register("guardians.father.occupation")}
              />
            </FormField>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-600">Mother</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Name" htmlFor="guardians.mother.name">
              <Input id="guardians.mother.name" {...register("guardians.mother.name")} />
            </FormField>
            <FormField label="Mobile" htmlFor="guardians.mother.mobile">
              <Input
                id="guardians.mother.mobile"
                type="tel"
                {...register("guardians.mother.mobile")}
              />
            </FormField>
            <FormField label="Occupation" htmlFor="guardians.mother.occupation">
              <Input
                id="guardians.mother.occupation"
                {...register("guardians.mother.occupation")}
              />
            </FormField>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-600">Local Guardian</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Name" htmlFor="guardians.localGuardian.name">
              <Input
                id="guardians.localGuardian.name"
                {...register("guardians.localGuardian.name")}
              />
            </FormField>
            <FormField label="Relation" htmlFor="guardians.localGuardian.relation">
              <Select
                id="guardians.localGuardian.relation"
                placeholder="Select relation"
                options={LOCAL_GUARDIAN_RELATION_OPTIONS}
                {...register("guardians.localGuardian.relation")}
              />
            </FormField>
            <FormField label="Mobile" htmlFor="guardians.localGuardian.mobile">
              <Input
                id="guardians.localGuardian.mobile"
                type="tel"
                {...register("guardians.localGuardian.mobile")}
              />
            </FormField>
          </div>
        </div>
      </div>
    </Card>
  );
}
