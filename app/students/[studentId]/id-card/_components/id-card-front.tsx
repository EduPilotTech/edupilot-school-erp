import type { StudentIdCardDTO } from "@/modules/students/application/dto/student-id-card.dto";

interface IdCardFrontProps {
  card: StudentIdCardDTO;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase();
}

// CR80 card face (85.6mm × 53.98mm — the standard PVC ID card size) — school branding, student
// photo, and core identity fields. Sized in real mm units so it renders true-to-life on both
// screen and print without a separate scale factor (see student-id-card.tsx for the
// screen-only zoom wrapper).
export function IdCardFront({ card }: IdCardFrontProps) {
  return (
    <div className="flex h-[53.98mm] w-[85.6mm] flex-col overflow-hidden rounded-[2mm] border border-zinc-300 bg-white text-black">
      <div
        className="flex items-center gap-[1.5mm] px-[3mm] py-[1.5mm] text-white"
        style={{ backgroundColor: card.school.themeColor || "#1D4ED8" }}
      >
        {card.school.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size print layout, not an optimizable responsive image.
          <img src={card.school.logoUrl} alt="" className="h-[6mm] w-[6mm] rounded-full bg-white object-contain" />
        ) : (
          <div className="h-[6mm] w-[6mm] rounded-full bg-white" />
        )}
        <p className="truncate text-[3mm] font-bold leading-tight">{card.school.name}</p>
      </div>

      <div className="flex flex-1 gap-[2.5mm] px-[3mm] py-[2mm]">
        {card.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size print layout.
          <img
            src={card.photoUrl}
            alt={card.student.fullName}
            className="h-[20mm] w-[16mm] flex-shrink-0 rounded-[1mm] border border-zinc-300 object-cover"
          />
        ) : (
          <div className="flex h-[20mm] w-[16mm] flex-shrink-0 items-center justify-center rounded-[1mm] border border-zinc-300 bg-zinc-100 text-[4mm] font-semibold text-zinc-500">
            {initials(card.student.fullName)}
          </div>
        )}

        <div className="flex min-w-0 flex-col justify-center gap-[0.8mm] text-[2.4mm] leading-tight">
          <p className="truncate text-[3.2mm] font-bold text-zinc-900">{card.student.fullName}</p>
          <p className="text-zinc-600">
            <span className="font-medium text-zinc-500">Adm No:</span> {card.student.admissionNumber}
          </p>
          {card.academic && (
            <p className="text-zinc-600">
              <span className="font-medium text-zinc-500">Class:</span> {card.academic.className}
              {" - "}
              {card.academic.sectionName}
            </p>
          )}
          <p className="text-zinc-600">
            <span className="font-medium text-zinc-500">DOB:</span>{" "}
            {card.student.dateOfBirth.toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-zinc-100 px-[3mm] py-[1mm] text-center text-[2.2mm] font-semibold uppercase tracking-wide text-zinc-500">
        Student ID Card
      </div>
    </div>
  );
}
