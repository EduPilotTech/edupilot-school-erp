import { Controller, useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { FileInput } from "@/components/ui/FileInput";
import type { AdmissionFormValues } from "./admission-form.schema";

const UPLOAD_FIELDS: {
  key: keyof AdmissionFormValues["uploads"];
  label: string;
  accept: string;
}[] = [
  { key: "studentPhoto", label: "Student Photo", accept: "image/*" },
  { key: "birthCertificate", label: "Birth Certificate", accept: "application/pdf,image/*" },
  { key: "transferCertificate", label: "Transfer Certificate", accept: "application/pdf,image/*" },
  { key: "aadhaarDocument", label: "Aadhaar", accept: "application/pdf,image/*" },
  { key: "otherDocuments", label: "Other Documents", accept: "application/pdf,image/*" },
];

// UI only — no upload/storage implementation, per this step's scope. Files are held in
// react-hook-form state as plain File objects (validated for size only, by
// admission-form.schema.ts) and go nowhere until a real upload service exists.
export function UploadsSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  return (
    <Card title="Uploads" description="Attach supporting documents (optional at this stage).">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {UPLOAD_FIELDS.map((field) => (
          <Controller
            key={field.key}
            name={`uploads.${field.key}`}
            control={control}
            render={({ field: { value, onChange } }) => (
              <FormField
                label={field.label}
                htmlFor={`uploads.${field.key}`}
                error={errors.uploads?.[field.key]?.message}
              >
                <FileInput
                  id={`uploads.${field.key}`}
                  accept={field.accept}
                  selectedFileName={value?.name}
                  onFileSelected={onChange}
                />
              </FormField>
            )}
          />
        ))}
      </div>
    </Card>
  );
}
