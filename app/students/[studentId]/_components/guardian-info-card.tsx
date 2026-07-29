import { Card } from "@/components/ui/Card";
import { EmptyState } from "./empty-state";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface GuardianInfoCardProps {
  guardians: StudentProfileDTO["guardians"];
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Local Guardian",
  OTHER: "Other",
};

export function GuardianInfoCard({ guardians }: GuardianInfoCardProps) {
  return (
    <Card title="Guardian Information">
      {guardians.length === 0 ? (
        <EmptyState message="No guardians on record." />
      ) : (
        <ul className="flex flex-col gap-4">
          {guardians.map((guardian) => (
            <li
              key={guardian.id}
              className="rounded-lg border border-zinc-200 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-zinc-900">{guardian.fullName}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                    {RELATIONSHIP_LABELS[guardian.relationship] ?? guardian.relationship}
                  </span>
                  {guardian.isPrimary && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Primary
                    </span>
                  )}
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-600 sm:grid-cols-3">
                <div>
                  <dt className="font-medium text-zinc-400">Occupation</dt>
                  <dd>{guardian.occupation ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-400">Phone</dt>
                  <dd>{guardian.phone ?? "—"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
