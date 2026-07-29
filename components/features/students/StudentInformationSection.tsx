import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdmissionFormValues } from "./admission-form.schema";
import { GENDER_OPTIONS } from "./admission-form.constants";

// Reads react-hook-form's API via useFormContext() (set up by AdmissionForm.tsx's
// FormProvider) rather than receiving register/errors as props — avoids prop-drilling the same
// three things into every one of the nine sections.
export function StudentInformationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<AdmissionFormValues>();

  return (
    <Card title="Student Information">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Admission No." htmlFor="admissionNumber">
          <Input id="admissionNumber" value="Auto-generated on submission" disabled readOnly />
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

        <FormField label="Middle Name" htmlFor="student.middleName">
          <Input id="student.middleName" {...register("student.middleName")} />
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

        <FormField
          label="Aadhaar Number"
          htmlFor="student.aadhaarNumber"
          hint="12 digits, spaces optional"
          error={errors.student?.aadhaarNumber?.message}
        >
          <Input
            id="student.aadhaarNumber"
            placeholder="1234 5678 9012"
            hasError={!!errors.student?.aadhaarNumber}
            {...register("student.aadhaarNumber")}
          />
        </FormField>

        <FormField
          label="Student Mobile"
          htmlFor="student.mobile"
          error={errors.student?.mobile?.message}
        >
          <Input
            id="student.mobile"
            type="tel"
            hasError={!!errors.student?.mobile}
            {...register("student.mobile")}
          />
        </FormField>

        <FormField label="Email" htmlFor="student.email" error={errors.student?.email?.message}>
          <Input
            id="student.email"
            type="email"
            hasError={!!errors.student?.email}
            {...register("student.email")}
          />
        </FormField>
      </div>
    </Card>
  );
}
