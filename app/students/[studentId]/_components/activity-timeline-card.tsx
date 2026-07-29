import { Card } from "@/components/ui/Card";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface ActivityTimelineCardProps {
  timeline: StudentProfileDTO["activityTimeline"];
}

// No AuditLog/status-history table exists yet (see modules/users' own TODO(audit) comments —
// this gap predates this step). `events` below are real data points (Student.createdAt/
// updatedAt), not fabricated — the note makes clear this is a partial picture, not a broken one.
export function ActivityTimelineCard({ timeline }: ActivityTimelineCardProps) {
  return (
    <Card title="Activity Timeline">
      <ul className="flex flex-col gap-3">
        {timeline.events.map((event, index) => (
          <li key={index} className="flex items-center gap-3 text-sm">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
            <span className="font-medium text-zinc-900">{event.label}</span>
            <span className="text-zinc-500">{event.timestamp.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {!timeline.available && (
        <p className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-xs text-zinc-500">
          Full activity history (status changes, edits) will be available once activity logging
          is implemented.
        </p>
      )}
    </Card>
  );
}
