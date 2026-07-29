import { Card } from "@/components/ui/Card";
import { EmptyState } from "./empty-state";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface MedicalCardProps {
  medical: StudentProfileDTO["medical"];
}

// No Medical model exists in prisma/schema.prisma yet — schema changes are out of scope this
// step, per the task's explicit instruction. `medical.available` is always false; this renders
// the professional empty state the task asked for rather than fabricating fields.
export function MedicalCard({ medical }: MedicalCardProps) {
  return (
    <Card title="Medical Information">
      {medical.available ? (
        <p className="text-sm text-zinc-500">No medical records on file.</p>
      ) : (
        <EmptyState message="Medical information is not yet tracked for students." />
      )}
    </Card>
  );
}
