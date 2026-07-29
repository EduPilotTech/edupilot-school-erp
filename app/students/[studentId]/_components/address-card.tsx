import { Card } from "@/components/ui/Card";
import { EmptyState } from "./empty-state";
import type { StudentProfileDTO } from "@/modules/students/application/dto/student-profile.dto";

interface AddressCardProps {
  address: StudentProfileDTO["address"];
}

function formatAddress(current: StudentProfileDTO["address"]["current"]): string | null {
  const parts = [current.address, current.city, current.state, current.country, current.postalCode]
    .filter((part) => part && part.trim().length > 0);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function AddressCard({ address }: AddressCardProps) {
  const formattedCurrent = formatAddress(address.current);

  return (
    <Card title="Address">
      <div className="flex flex-col gap-4 text-sm">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Current Address
          </h4>
          <p className="mt-1 text-zinc-900">{formattedCurrent ?? "—"}</p>
        </div>

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Permanent Address
          </h4>
          <div className="mt-1">
            <EmptyState message="Permanent address is not collected separately for this student." />
          </div>
        </div>
      </div>
    </Card>
  );
}
