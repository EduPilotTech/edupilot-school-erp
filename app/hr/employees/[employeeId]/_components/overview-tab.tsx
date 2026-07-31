import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { EmployeeProfileDTO } from "@/modules/hr/application/dto/employee.dto";

interface OverviewTabProps {
  profile: EmployeeProfileDTO;
}

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return `${parts[0]?.charAt(0) ?? ""}${parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : ""}`.toUpperCase();
}

// Plain Server Component — renders getEmployeeProfile's full read model (Employee fields +
// UserProfile identity + Department/Designation/EmploymentType names + reporting manager name),
// mirroring app/students/[studentId]/_components/overview-card.tsx's exact layout: an avatar +
// name + status header, then a definition-list grid of the remaining fields.
export function OverviewTab({ profile }: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Employee Overview">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-2xl font-semibold text-zinc-500">
            {initials(profile.fullName)}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold text-zinc-900">{profile.fullName}</h3>
              <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                {statusLabel(profile.employmentStatus)}
              </span>
              {!profile.isActive && (
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  Inactive
                </span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Employee Code</dt>
                <dd className="text-zinc-900">{profile.employeeCode}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Email</dt>
                <dd className="text-zinc-900">{profile.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Phone</dt>
                <dd className="text-zinc-900">{profile.phone ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Employment">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Department</dt>
              <dd className="text-zinc-900">{profile.departmentName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Designation</dt>
              <dd className="text-zinc-900">{profile.designationName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Employment Type</dt>
              <dd className="text-zinc-900">{profile.employmentTypeName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Reporting Manager</dt>
              <dd className="text-zinc-900">
                {profile.reportingManagerId ? (
                  <Link href={`/hr/employees/${profile.reportingManagerId}`} className="text-blue-600 hover:underline">
                    {profile.reportingManagerName ?? "—"}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Joining Date</dt>
              <dd className="text-zinc-900">{profile.joiningDate.toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Confirmation Date</dt>
              <dd className="text-zinc-900">{profile.confirmationDate ? profile.confirmationDate.toLocaleDateString() : "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Background">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Qualification</dt>
              <dd className="text-zinc-900">{profile.qualification ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Experience</dt>
              <dd className="text-zinc-900">{profile.experienceYears !== null ? `${profile.experienceYears} years` : "—"}</dd>
            </div>
          </dl>
        </Card>

        <div className="md:col-span-2">
          <Card title="Emergency Contact">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Name</dt>
                <dd className="text-zinc-900">{profile.emergencyContactName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Phone</dt>
                <dd className="text-zinc-900">{profile.emergencyContactPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Relation</dt>
                <dd className="text-zinc-900">{profile.emergencyContactRelation ?? "—"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
