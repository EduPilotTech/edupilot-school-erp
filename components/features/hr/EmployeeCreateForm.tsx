"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployeeAction } from "@/app/hr/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { DepartmentDTO, DesignationDTO, EmploymentTypeDTO } from "@/modules/hr/application/dto/hr-master.dto";
import type { EmployeeDTO } from "@/modules/hr/application/dto/employee.dto";

interface CandidateUser {
  id: string;
  fullName: string;
  email: string | null;
}

interface EmployeeCreateFormProps {
  candidates: CandidateUser[];
  departments: DepartmentDTO[];
  designations: DesignationDTO[];
  employmentTypes: EmploymentTypeDTO[];
  reportingManagerCandidates: EmployeeDTO[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Promotes an existing UserProfile into an Employee record — never creates a new UserProfile,
// mirroring components/features/teachers/TeacherManager.tsx's exact precedent (Phase 6 Decision
// 1: UserProfile remains the identity, Employee is a 1:1 extension). Plain useState fields
// rather than react-hook-form, matching the simpler create-form precedents in this codebase
// (TeacherManager, HostelBuildingManager) rather than the heavier Admission form.
export function EmployeeCreateForm({
  candidates,
  departments,
  designations,
  employmentTypes,
  reportingManagerCandidates,
}: EmployeeCreateFormProps) {
  const router = useRouter();
  const [userProfileId, setUserProfileId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [joiningDate, setJoiningDate] = useState(todayIsoDate());
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [employmentTypeId, setEmploymentTypeId] = useState("");
  const [reportingManagerId, setReportingManagerId] = useState("");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = userProfileId && employeeCode && joiningDate && departmentId && designationId && employmentTypeId;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createEmployeeAction({
        userProfileId,
        employeeCode,
        joiningDate,
        departmentId,
        designationId,
        employmentTypeId,
        reportingManagerId: reportingManagerId || undefined,
        qualification: qualification || undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        emergencyContactRelation: emergencyContactRelation || undefined,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      router.push(`/hr/employees/${result.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card title="Staff Member" description="Select the existing user account this employee record extends.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Staff Member" htmlFor="employee-user" required>
            <Select
              id="employee-user"
              value={userProfileId}
              onChange={(e) => setUserProfileId(e.target.value)}
              placeholder="Select user"
              options={candidates.map((candidate) => ({
                value: candidate.id,
                label: candidate.email ? `${candidate.fullName} (${candidate.email})` : candidate.fullName,
              }))}
            />
          </FormField>

          <FormField label="Employee Code" htmlFor="employee-code" required>
            <Input
              id="employee-code"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="EMP-001"
            />
          </FormField>

          <FormField label="Joining Date" htmlFor="employee-joining-date" required>
            <Input
              id="employee-joining-date"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </FormField>
        </div>
      </Card>

      <Card title="Employment Details" description="Department, designation, employment type, and reporting line.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Department" htmlFor="employee-department" required>
            <Select
              id="employee-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              placeholder="Select department"
              options={departments.map((department) => ({ value: department.id, label: department.name }))}
            />
          </FormField>

          <FormField label="Designation" htmlFor="employee-designation" required>
            <Select
              id="employee-designation"
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              placeholder="Select designation"
              options={designations.map((designation) => ({ value: designation.id, label: designation.name }))}
            />
          </FormField>

          <FormField label="Employment Type" htmlFor="employee-employment-type" required>
            <Select
              id="employee-employment-type"
              value={employmentTypeId}
              onChange={(e) => setEmploymentTypeId(e.target.value)}
              placeholder="Select employment type"
              options={employmentTypes.map((employmentType) => ({ value: employmentType.id, label: employmentType.name }))}
            />
          </FormField>

          <FormField label="Reporting Manager" htmlFor="employee-reporting-manager" hint="Optional">
            <Select
              id="employee-reporting-manager"
              value={reportingManagerId}
              onChange={(e) => setReportingManagerId(e.target.value)}
              placeholder="No reporting manager"
              options={reportingManagerCandidates.map((manager) => ({
                value: manager.id,
                label: `${manager.fullName} (${manager.employeeCode})`,
              }))}
            />
          </FormField>
        </div>
      </Card>

      <Card title="Background" description="Qualification and prior experience.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Qualification" htmlFor="employee-qualification" hint="Optional">
            <Input
              id="employee-qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="M.Sc, B.Ed"
            />
          </FormField>

          <FormField label="Experience (Years)" htmlFor="employee-experience-years" hint="Optional">
            <Input
              id="employee-experience-years"
              type="number"
              min={0}
              max={80}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
          </FormField>
        </div>
      </Card>

      <Card title="Emergency Contact" description="Who to reach in case of an emergency.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Name" htmlFor="employee-emergency-name" hint="Optional">
            <Input
              id="employee-emergency-name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
          </FormField>

          <FormField label="Phone" htmlFor="employee-emergency-phone" hint="Optional">
            <Input
              id="employee-emergency-phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
            />
          </FormField>

          <FormField label="Relation" htmlFor="employee-emergency-relation" hint="Optional">
            <Input
              id="employee-emergency-relation"
              value={emergencyContactRelation}
              onChange={(e) => setEmergencyContactRelation(e.target.value)}
              placeholder="Spouse, Parent, Sibling"
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
          onClick={() => router.push("/hr/employees")}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Adding…" : "Add Employee"}
        </button>
      </div>
    </form>
  );
}
