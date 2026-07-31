"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyPersonalInfoAction } from "@/app/employee-portal/actions";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { EmployeeProfileDTO } from "@/modules/hr/application/dto/employee.dto";

interface ProfileFormProps {
  profile: EmployeeProfileDTO;
}

// Only qualification + the 3 emergency-contact fields are editable here — everything else
// (department, designation, employment type/status, salary, employee code) is HR-managed only
// and rendered read-only below. Matches updateMyPersonalInfoSchema
// (modules/hr/application/dto/employee.dto.ts) exactly: the form can't submit any field that
// schema wouldn't accept, and updateMyPersonalInfoAction resolves employeeId server-side anyway
// so there is no employeeId field on this form at all.
export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [qualification, setQualification] = useState(profile.qualification ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(profile.emergencyContactName ?? "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile.emergencyContactPhone ?? "");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(profile.emergencyContactRelation ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await updateMyPersonalInfoAction({
        qualification: qualification.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        emergencyContactRelation: emergencyContactRelation.trim() || null,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSuccessMessage("Your details were updated.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Employment Details" description="Managed by HR — contact the office to request changes.">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Employee Code</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.employeeCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Department</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.departmentName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Designation</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.designationName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Employment Type</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.employmentTypeName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Employment Status</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.employmentStatus}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Joining Date</dt>
            <dd className="mt-1 text-sm text-zinc-900">{new Date(profile.joiningDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Reporting Manager</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.reportingManagerName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Experience (years)</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.experienceYears ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bank Detail on File</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.hasBankDetail ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Documents on File</dt>
            <dd className="mt-1 text-sm text-zinc-900">{profile.documentCount}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Personal Details" description="Qualification and emergency contact — editable by you.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Qualification" htmlFor="qualification">
            <Input
              id="qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              maxLength={200}
              placeholder="e.g. M.Sc. Mathematics"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Emergency Contact Name" htmlFor="emergency-contact-name">
              <Input
                id="emergency-contact-name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                maxLength={200}
              />
            </FormField>
            <FormField label="Emergency Contact Phone" htmlFor="emergency-contact-phone">
              <Input
                id="emergency-contact-phone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                maxLength={30}
              />
            </FormField>
            <FormField label="Emergency Contact Relation" htmlFor="emergency-contact-relation">
              <Input
                id="emergency-contact-relation"
                value={emergencyContactRelation}
                onChange={(e) => setEmergencyContactRelation(e.target.value)}
                maxLength={100}
                placeholder="e.g. Spouse"
              />
            </FormField>
          </div>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
          {successMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
