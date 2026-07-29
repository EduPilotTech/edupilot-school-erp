import "server-only";
import { emptyStatusCounts, type AttendanceStatusCounts } from "./dto/attendance-report.dto";
import type { AttendanceStatusValue } from "../domain/attendance.entity";

// Shared by every report service — tallies a list of statuses into per-status counts + total.
export function countByStatus(statuses: AttendanceStatusValue[]): AttendanceStatusCounts {
  const counts = emptyStatusCounts();
  for (const status of statuses) {
    counts[status] += 1;
    counts.total += 1;
  }
  return counts;
}
