import { IdCardQrCode } from "./id-card-qr-code";
import type { StudentIdCardDTO } from "@/modules/students/application/dto/student-id-card.dto";

interface IdCardBackProps {
  card: StudentIdCardDTO;
}

// CR80 card back — QR code + school contact details + a signature line. Same real-mm sizing as
// IdCardFront.
export function IdCardBack({ card }: IdCardBackProps) {
  return (
    <div className="flex h-[53.98mm] w-[85.6mm] flex-col justify-between overflow-hidden rounded-[2mm] border border-zinc-300 bg-white px-[3mm] py-[2.5mm] text-black">
      <div className="flex gap-[3mm]">
        <IdCardQrCode value={card.qrValue} sizeMm={16} />
        <div className="flex min-w-0 flex-col justify-center gap-[0.6mm] text-[2.2mm] leading-tight text-zinc-600">
          <p className="font-semibold text-zinc-900">If found, please return to:</p>
          <p className="truncate">{card.school.name}</p>
          <p className="truncate">{card.school.address}</p>
          <p>{card.school.phone}</p>
          <p className="truncate">{card.school.email}</p>
        </div>
      </div>

      <div className="flex items-end justify-between text-[2.2mm] text-zinc-500">
        <div className="border-t border-zinc-300 pt-[0.8mm]">Student Signature</div>
        <div className="flex items-end gap-[1.5mm]">
          {card.school.sealUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- fixed-size print layout.
            <img src={card.school.sealUrl} alt="" className="h-[7mm] w-[7mm] object-contain opacity-80" />
          )}
          <div className="flex flex-col items-center">
            {card.school.signatureUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- fixed-size print layout.
              <img src={card.school.signatureUrl} alt="" className="h-[4mm] w-[14mm] object-contain" />
            )}
            <div className="w-[14mm] border-t border-zinc-300 pt-[0.8mm] text-center">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
