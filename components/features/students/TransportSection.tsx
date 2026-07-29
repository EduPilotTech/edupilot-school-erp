import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import type { AdmissionFormValues } from "./admission-form.schema";

export function TransportSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  const transportRequired = watch("transport.required");

  return (
    <Card title="Transport">
      <div className="flex flex-col gap-4">
        <Checkbox
          id="transport.required"
          label="Transport Required"
          {...register("transport.required")}
        />

        {transportRequired && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Route"
              htmlFor="transport.route"
              required
              error={errors.transport?.route?.message}
            >
              <Input
                id="transport.route"
                hasError={!!errors.transport?.route}
                {...register("transport.route")}
              />
            </FormField>
            <FormField
              label="Pickup Point"
              htmlFor="transport.pickupPoint"
              required
              error={errors.transport?.pickupPoint?.message}
            >
              <Input
                id="transport.pickupPoint"
                hasError={!!errors.transport?.pickupPoint}
                {...register("transport.pickupPoint")}
              />
            </FormField>
          </div>
        )}
      </div>
    </Card>
  );
}
