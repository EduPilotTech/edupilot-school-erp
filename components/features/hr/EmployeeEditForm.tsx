"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEmployeeAction } from "@/app/hr/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { DepartmentDTO, DesignationDTO, EmploymentTypeDTO } from "@/modules/hr/application/dto/hr-master.dto";
import type { EmployeeDTO, EmployeeProfileDTO } from "@/modules/hr/application/dto/employee.dto";
import type { EmploymentStatusValue } from "@/modules/hr/domain/employee.entity";

interface EmployeeEditFormProps {
  profile: EmployeeProfileDTO;
  departments: DepartmentDTO[];
  designations: DesignationDTO[];
  employmentTypes: EmploymentTypeDTO[];
  reportingManagerCandidates: EmployeeDTO[];
}

const STATUS_OPTIONS: EmploymentStatusValue[] = [
  "ACTIVE",
  "ON_PROBATION",
  "ON_LEAVE",
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
];

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

// Editable: Department, Designation, Employment Type, Reporting Manager, Confirmation Date,
// Employment Status, Qualification, Experience Years, Emergency Contact fields — matching
// updateEmployeeSchema exactly. employeeCode, joiningDate, and userProfileId are immutable after
// creation and are not rendered here, mirroring updateEmployeeSchema's own comment
// ("employeeCode is deliberately not updatable here").
export function EmployeeEditForm({
  profile,
  departments,
  designations,
  employmentTypes,
  reportingManagerCandidates,
}: EmployeeEditFormProps) {
  const router = useRouter();
  const [departmentId, setDepartmentId] = useState(profile.departmentId);
  const [designationId, setDesignationId] = useState(profile.designationId);
  const [employmentTypeId, setEmploymentTypeId] = useState(profile.employmentTypeId);
  const [reportingManagerId, setReportingManagerId] = useState(profile.reportingManagerId ?? "");
  const [confirmationDate, setConfirmationDate] = useState(toDateInputValue(profile.confirmationDate));
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatusValue>(profile.employmentStatus);
  const [qualification, setQualification] = useState(profile.qualification ?? "");
  const [experienceYears, setExperienceYears] = useState(
    profile.experienceYears !== null ? String(profile.experienceYears) : ""
  );
  const [emergencyContactName, setEmergencyContactName] = useState(profile.emergencyContactName ?? "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile.emergencyContactPhone ?? "");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(profile.emergencyContactRelation ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateEmployeeAction(profile.id, {
        departmentId,
        designationId,
        employmentTypeId,
        reportingManagerId: reportingManagerId || null,
        confirmationDate: confirmationDate || null,
        employmentStatus,
        qualification: qualification || null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyContactRelation: emergencyContactRelation || null,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      router.push(`/hr/employees/${profile.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card title="Employment Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Department" htmlFor="edit-employee-department" required>
            <Select
              id="edit-employee-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((department) => ({ value: department.id, label: department.name }))}
            />
          </FormField>

          <FormField label="Designation" htmlFor="edit-employee-designation" required>
            <Select
              id="edit-employee-designation"
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              options={designations.map((designation) => ({ value: designation.id, label: designation.name }))}
            />
          </FormField>

          <FormField label="Employment Type" htmlFor="edit-employee-employment-type" required>
            <Select
              id="edit-employee-employment-type"
              value={employmentTypeId}
              onChange={(e) => setEmploymentTypeId(e.target.value)}
              options={employmentTypes.map((employmentType) => ({ value: employmentType.id, label: employmentType.name }))}
            />
          </FormField>

          <FormField label="Reporting Manager" htmlFor="edit-employee-reporting-manager" hint="Optional">
            <Select
              id="edit-employee-reporting-manager"
              value={reportingManagerId}
              onChange={(e) => setReportingManagerId(e.target.value)}
              placeholder="No reporting manager"
              options={reportingManagerCandidates.map((manager) => ({
                value: manager.id,
                label: `${manager.fullName} (${manager.employeeCode})`,
              }))}
            />
          </FormField>

          <FormField label="Confirmation Date" htmlFor="edit-employee-confirmation-date" hint="Optional">
            <Input
              id="edit-employee-confirmation-date"
              type="date"
              value={confirmationDate}
              onChange={(e) => setConfirmationDate(e.target.value)}
            />
          </FormField>

          <FormField label="Employment Status" htmlFor="edit-employee-status" required>
            <Select
              id="edit-employee-status"
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatusValue)}
              options={STATUS_OPTIONS.map((status) => ({ value: status, label: statusLabel(status) }))}
            />
          </FormField>
        </div>
      </Card>

      <Card title="Background">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Qualification" htmlFor="edit-employee-qualification" hint="Optional">
            <Input
              id="edit-employee-qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
            />
          </FormField>

          <FormField label="Experience (Years)" htmlFor="edit-employee-experience-years" hint="Optional">
            <Input
              id="edit-employee-experience-years"
              type="number"
              min={0}
              max={80}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
          </FormField>
        </div>
      </Card>

      <Card title="Emergency Contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Name" htmlFor="edit-employee-emergency-name" hint="Optional">
            <Input
              id="edit-employee-emergency-name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
          </FormField>

          <FormField label="Phone" htmlFor="edit-employee-emergency-phone" hint="Optional">
            <Input
              id="edit-employee-emergency-phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
            />
          </FormField>

          <FormField label="Relation" htmlFor="edit-employee-emergency-relation" hint="Optional">
            <Input
              id="edit-employee-emergency-relation"
              value={emergencyContactRelation}
              onChange={(e) => setEmergencyContactRelation(e.target.value)}
            />
          </FormField>
        </div>
      </Card>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={() => router.push(`/hr/employees/${profile.id}`)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
