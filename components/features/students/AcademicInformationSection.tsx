import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdmissionFormValues } from "./admission-form.schema";
import type { AcademicOptions } from "./admission-form.types";

interface AcademicInformationSectionProps {
  options: AcademicOptions;
}

// `options` is a prop, not fetched here — this is a Client Component with no repository access
// this sprint ("No database writes. No repository calls."). AdmissionForm.tsx currently passes
// empty arrays; wiring these to real Academic Session/Class/Section data is the next
// implementation step, once modules/academics' application services exist.
export function AcademicInformationSection({ options }: AcademicInformationSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  return (
    <Card title="Academic Information">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          label="Academic Session"
          htmlFor="academic.academicSessionId"
          required
          error={errors.academic?.academicSessionId?.message}
          hint={options.academicSessions.length === 0 ? "No sessions available yet" : undefined}
        >
          <Select
            id="academic.academicSessionId"
            placeholder="Select academic session"
            options={options.academicSessions}
            hasError={!!errors.academic?.academicSessionId}
            {...register("academic.academicSessionId")}
          />
        </FormField>

        <FormField
          label="Class"
          htmlFor="academic.classId"
          required
          error={errors.academic?.classId?.message}
          hint={options.classes.length === 0 ? "No classes available yet" : undefined}
        >
          <Select
            id="academic.classId"
            placeholder="Select class"
            options={options.classes}
            hasError={!!errors.academic?.classId}
            {...register("academic.classId")}
          />
        </FormField>

        <FormField
          label="Section"
          htmlFor="academic.sectionId"
          required
          error={errors.academic?.sectionId?.message}
          hint={options.sections.length === 0 ? "No sections available yet" : undefined}
        >
          <Select
            id="academic.sectionId"
            placeholder="Select section"
            options={options.sections}
            hasError={!!errors.academic?.sectionId}
            {...register("academic.sectionId")}
          />
        </FormField>

        <FormField label="Roll Number" htmlFor="academic.rollNumber">
          <Input id="academic.rollNumber" {...register("academic.rollNumber")} />
        </FormField>

        <FormField
          label="Admission Date"
          htmlFor="academic.admissionDate"
          required
          error={errors.academic?.admissionDate?.message}
        >
          <Input
            id="academic.admissionDate"
            type="date"
            hasError={!!errors.academic?.admissionDate}
            {...register("academic.admissionDate")}
          />
        </FormField>
      </div>
    </Card>
  );
}
