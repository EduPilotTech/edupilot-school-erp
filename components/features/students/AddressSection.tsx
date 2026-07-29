import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import type { AdmissionFormValues } from "./admission-form.schema";

function AddressFields({
  prefix,
  disabled,
}: {
  prefix: "address.current" | "address.permanent";
  disabled?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  const sectionErrors =
    prefix === "address.current" ? errors.address?.current : errors.address?.permanent;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField
        label="Address Line 1"
        htmlFor={`${prefix}.line1`}
        required={!disabled}
        error={sectionErrors?.line1?.message}
      >
        <Input
          id={`${prefix}.line1`}
          disabled={disabled}
          hasError={!!sectionErrors?.line1}
          {...register(`${prefix}.line1`)}
        />
      </FormField>
      <FormField label="Address Line 2" htmlFor={`${prefix}.line2`}>
        <Input id={`${prefix}.line2`} disabled={disabled} {...register(`${prefix}.line2`)} />
      </FormField>
      <FormField
        label="City"
        htmlFor={`${prefix}.city`}
        required={!disabled}
        error={sectionErrors?.city?.message}
      >
        <Input
          id={`${prefix}.city`}
          disabled={disabled}
          hasError={!!sectionErrors?.city}
          {...register(`${prefix}.city`)}
        />
      </FormField>
      <FormField
        label="State"
        htmlFor={`${prefix}.state`}
        required={!disabled}
        error={sectionErrors?.state?.message}
      >
        <Input
          id={`${prefix}.state`}
          disabled={disabled}
          hasError={!!sectionErrors?.state}
          {...register(`${prefix}.state`)}
        />
      </FormField>
      <FormField
        label="Country"
        htmlFor={`${prefix}.country`}
        required={!disabled}
        error={sectionErrors?.country?.message}
      >
        <Input
          id={`${prefix}.country`}
          disabled={disabled}
          hasError={!!sectionErrors?.country}
          {...register(`${prefix}.country`)}
        />
      </FormField>
      <FormField
        label="Postal Code"
        htmlFor={`${prefix}.postalCode`}
        required={!disabled}
        error={sectionErrors?.postalCode?.message}
      >
        <Input
          id={`${prefix}.postalCode`}
          disabled={disabled}
          hasError={!!sectionErrors?.postalCode}
          {...register(`${prefix}.postalCode`)}
        />
      </FormField>
    </div>
  );
}

export function AddressSection() {
  const { register, watch, setValue } = useFormContext<AdmissionFormValues>();

  const sameAsCurrentAddress = watch("address.sameAsCurrentAddress");
  const current = watch("address.current");

  // Mirrors Current Address into Permanent Address whenever the checkbox is checked or the
  // current address changes while it's checked — the permanent fields stay disabled/synced
  // rather than requiring the user to re-type the same values.
  useEffect(() => {
    if (sameAsCurrentAddress) {
      setValue("address.permanent", current, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAsCurrentAddress, JSON.stringify(current)]);

  return (
    <Card title="Address">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-600">Current Address</h3>
          <AddressFields prefix="address.current" />
        </div>

        <Checkbox
          id="address.sameAsCurrentAddress"
          label="Same as Current Address"
          {...register("address.sameAsCurrentAddress")}
        />

        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-600">Permanent Address</h3>
          <AddressFields prefix="address.permanent" disabled={sameAsCurrentAddress} />
        </div>
      </div>
    </Card>
  );
}
