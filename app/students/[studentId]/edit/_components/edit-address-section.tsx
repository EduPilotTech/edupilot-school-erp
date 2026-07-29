import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { EditStudentFormValues } from "./edit-student-form.schema";

// Only "Current Address" — Student has one `address` column, no separate "permanent address"
// (see modules/students/application/dto/student-profile.dto.ts's comment).
export function EditAddressSection() {
  const { register } = useFormContext<EditStudentFormValues>();

  return (
    <Card title="Address">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="Address" htmlFor="address.address">
            <Textarea id="address.address" {...register("address.address")} />
          </FormField>
        </div>

        <FormField label="City" htmlFor="address.city">
          <Input id="address.city" {...register("address.city")} />
        </FormField>

        <FormField label="State" htmlFor="address.state">
          <Input id="address.state" {...register("address.state")} />
        </FormField>

        <FormField label="Country" htmlFor="address.country">
          <Input id="address.country" {...register("address.country")} />
        </FormField>

        <FormField label="Postal Code" htmlFor="address.postalCode">
          <Input id="address.postalCode" {...register("address.postalCode")} />
        </FormField>
      </div>
    </Card>
  );
}
