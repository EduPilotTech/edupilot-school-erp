import { Card } from "@/components/ui/Card";
import { StudentStatusBadge } from "../../_components/student-status-badge";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface OverviewCardProps {
  student: StudentProfileDTO["student"];
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Student.photoUrl has no backing upload module yet (Sprint 4 — Step 4: "No Upload Storage") —
// almost always null in practice. An initials avatar is the fallback, not a placeholder image
// file, to avoid depending on any asset that doesn't exist.
// A rendered profile is, by definition, never soft-deleted — get-student-profile.service.ts
// throws StudentNotFoundError before returning one — so the status badge here always passes
// `deletedAt: null` rather than threading a value through that can only ever be null.
export function OverviewCard({ student }: OverviewCardProps) {
  return (
    <Card title="Student Overview">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {student.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external/unconfigured photo host until an upload module exists; next/image would need remotePatterns config out of this step's scope.
          <img
            src={student.photoUrl}
            alt={student.fullName}
            className="h-24 w-24 flex-shrink-0 rounded-full border border-zinc-200 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-2xl font-semibold text-zinc-500">
            {initials(student.firstName, student.lastName)}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-zinc-900">{student.fullName}</h3>
            <StudentStatusBadge status={student.status} deletedAt={null} />
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Admission Number</dt>
              <dd className="text-zinc-900">{student.admissionNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Gender</dt>
              <dd className="text-zinc-900">
                {student.gender ? GENDER_LABELS[student.gender] : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Date of Birth</dt>
              <dd className="text-zinc-900">{student.dateOfBirth.toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Age</dt>
              <dd className="text-zinc-900">{student.age} years</dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}
