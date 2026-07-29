import { Card } from "@/components/ui/Card";
import { EmptyState } from "./empty-state";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface AcademicInfoCardProps {
  academic: StudentProfileDTO["academic"];
}

export function AcademicInfoCard({ academic }: AcademicInfoCardProps) {
  return (
    <Card title="Academic Information">
      {academic ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-zinc-500">Academic Session</dt>
            <dd className="text-zinc-900">{academic.academicSessionName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Class</dt>
            <dd className="text-zinc-900">{academic.className}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Section</dt>
            <dd className="text-zinc-900">{academic.sectionName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Roll Number</dt>
            <dd className="text-zinc-900">{academic.rollNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Admission Date</dt>
            <dd className="text-zinc-900">{academic.admissionDate.toLocaleDateString()}</dd>
          </div>
        </dl>
      ) : (
        <EmptyState message="This student has no current enrollment." />
      )}
    </Card>
  );
}
