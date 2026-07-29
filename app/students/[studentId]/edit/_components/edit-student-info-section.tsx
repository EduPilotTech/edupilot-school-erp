import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GENDER_OPTIONS } from "@/components/features/students/admission-form.constants";
import type { EditStudentFormValues } from "./edit-student-form.schema";

// Admission Number is deliberately not editable here — immutable once assigned (see
// update-student-profile.dto.ts's comment); shown read-only for context, matching how
// StudentInformationSection shows it during admission.
export function EditStudentInfoSection({ admissionNumber }: { admissionNumber: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<EditStudentFormValues>();

  return (
    <Card title="Student Information">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Admission No." htmlFor="admissionNumber">
          <Input id="admissionNumber" value={admissionNumber} disabled readOnly />
        </FormField>

        <FormField
          label="First Name"
          htmlFor="student.firstName"
          required
          error={errors.student?.firstName?.message}
        >
          <Input
            id="student.firstName"
            hasError={!!errors.student?.firstName}
            {...register("student.firstName")}
          />
        </FormField>

        <FormField
          label="Last Name"
          htmlFor="student.lastName"
          required
          error={errors.student?.lastName?.message}
        >
          <Input
            id="student.lastName"
            hasError={!!errors.student?.lastName}
            {...register("student.lastName")}
          />
        </FormField>

        <FormField
          label="Gender"
          htmlFor="student.gender"
          required
          error={errors.student?.gender?.message}
        >
          <Select
            id="student.gender"
            placeholder="Select gender"
            options={GENDER_OPTIONS}
            hasError={!!errors.student?.gender}
            {...register("student.gender")}
          />
        </FormField>

        <FormField
          label="Date of Birth"
          htmlFor="student.dateOfBirth"
          required
          error={errors.student?.dateOfBirth?.message}
        >
          <Input
            id="student.dateOfBirth"
            type="date"
            hasError={!!errors.student?.dateOfBirth}
            {...register("student.dateOfBirth")}
          />
        </FormField>
      </div>
    </Card>
  );
}
