"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reserveBookAction, cancelReservationAction, fulfillReservationAction } from "@/app/library/actions";
import { MemberPicker } from "./MemberPicker";
import type { BookReservationDTO } from "@/modules/library/application/dto/reservation.dto";

interface MemberOption {
  id: string;
  label: string;
}

interface ReservationManagerProps {
  bookId: string;
  items: BookReservationDTO[];
  students: MemberOption[];
  teachers: MemberOption[];
  staff: MemberOption[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  AVAILABLE: "Available — ready for pickup",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function ReservationManager({ bookId, items, students, teachers, staff }: ReservationManagerProps) {
  const router = useRouter();
  const [memberType, setMemberType] = useState("STUDENT");
  const [memberId, setMemberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReserve() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await reserveBookAction({ bookId, memberType, memberId, reservationDate: todayIsoDate() });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMemberId("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(reservationId: string) {
    setBusyId(reservationId);
    setError(null);
    try {
      const result = await cancelReservationAction(reservationId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleFulfill(reservationId: string) {
    setBusyId(reservationId);
    setError(null);
    try {
      const result = await fulfillReservationAction(reservationId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <MemberPicker
          memberType={memberType}
          memberId={memberId}
          onMemberTypeChange={setMemberType}
          onMemberIdChange={setMemberId}
          students={students}
          teachers={teachers}
          staff={staff}
        />
        <button
          type="button"
          onClick={handleReserve}
          disabled={isSubmitting || !memberId}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Reserving…" : "Reserve"}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Member</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reserved On</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((reservation) => (
              <tr key={reservation.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  {reservation.memberType} · {reservation.memberId.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-zinc-700">{reservation.reservationDate}</td>
                <td className="px-4 py-2 text-zinc-700">{STATUS_LABELS[reservation.status] ?? reservation.status}</td>
                <td className="px-4 py-2 text-right">
                  {(reservation.status === "PENDING" || reservation.status === "AVAILABLE") && (
                    <button
                      type="button"
                      onClick={() => handleCancel(reservation.id)}
                      disabled={busyId === reservation.id}
                      className="mr-3 text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  {reservation.status === "AVAILABLE" && (
                    <button
                      type="button"
                      onClick={() => handleFulfill(reservation.id)}
                      disabled={busyId === reservation.id}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      Fulfill (Issue)
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No reservations for this book.</p>}
      </div>
    </div>
  );
}
