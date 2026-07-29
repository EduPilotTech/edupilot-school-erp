import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import type { AdmissionFormValues } from "./admission-form.schema";

export function DeclarationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  return (
    <Card title="Declaration">
      <Checkbox
        id="declarationAccepted"
        label="I confirm all information is correct."
        {...register("declarationAccepted")}
      />
      {errors.declarationAccepted && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {errors.declarationAccepted.message}
        </p>
      )}
    </Card>
  );
}
