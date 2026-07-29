import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import type { AdmissionFormValues } from "./admission-form.schema";

export function HostelSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  const hostelRequired = watch("hostel.required");

  return (
    <Card title="Hostel">
      <div className="flex flex-col gap-4">
        <Checkbox id="hostel.required" label="Hostel Required" {...register("hostel.required")} />

        {hostelRequired && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Hostel Name"
              htmlFor="hostel.hostelName"
              required
              error={errors.hostel?.hostelName?.message}
            >
              <Input
                id="hostel.hostelName"
                hasError={!!errors.hostel?.hostelName}
                {...register("hostel.hostelName")}
              />
            </FormField>
            <FormField
              label="Room Number"
              htmlFor="hostel.roomNumber"
              required
              error={errors.hostel?.roomNumber?.message}
            >
              <Input
                id="hostel.roomNumber"
                hasError={!!errors.hostel?.roomNumber}
                {...register("hostel.roomNumber")}
              />
            </FormField>
          </div>
        )}
      </div>
    </Card>
  );
}
