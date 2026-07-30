"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBookCopyAction, updateBookCopyShelfAction, deleteBookCopyAction } from "@/app/library/actions";
import { BookCopyLabel } from "./BookCopyLabel";
import type { BookCopyDTO } from "@/modules/library/application/dto/location.dto";

interface ShelfOption {
  id: string;
  label: string;
}

interface BookCopyManagerProps {
  bookId: string;
  items: BookCopyDTO[];
  shelves: ShelfOption[];
  canManage: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ISSUED: "Issued",
  RESERVED: "Reserved (on hold)",
  LOST: "Lost",
  DAMAGED: "Damaged",
};

// Each copy's Accession Number is the single canonical identifier — both the QR code and the
// Code128 barcode below are generated automatically from it (requirement 12), with no separate
// stored encoding.
export function BookCopyManager({ bookId, items, shelves, canManage }: BookCopyManagerProps) {
  const router = useRouter();
  const [accessionNumber, setAccessionNumber] = useState("");
  const [shelfId, setShelfId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createBookCopyAction({
        bookId,
        shelfId: shelfId || undefined,
        accessionNumber: accessionNumber || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setAccessionNumber("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReshelve(copy: BookCopyDTO, newShelfId: string) {
    setEditingId(copy.id);
    setError(null);
    try {
      const result = await updateBookCopyShelfAction(copy.id, { shelfId: newShelfId || null });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(copy: BookCopyDTO) {
    setEditingId(copy.id);
    setError(null);
    try {
      const result = await deleteBookCopyAction(copy.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  const shelfById = new Map(shelves.map((s) => [s.id, s.label]));

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="copy-accession" className="text-xs font-medium text-zinc-500">
              Accession Number (leave blank to auto-generate)
            </label>
            <input
              id="copy-accession"
              value={accessionNumber}
              onChange={(e) => setAccessionNumber(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="copy-shelf" className="text-xs font-medium text-zinc-500">
              Shelf (optional)
            </label>
            <select
              id="copy-shelf"
              value={shelfId}
              onChange={(e) => setShelfId(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Not shelved yet</option>
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Copy"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-3">
        {items.map((copy) => (
          <div key={copy.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4">
            <BookCopyLabel accessionNumber={copy.accessionNumber} />
            <div className="flex flex-col gap-1 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">{STATUS_LABELS[copy.status] ?? copy.status}</span>
              <span className="text-zinc-500">{copy.shelfId ? shelfById.get(copy.shelfId) ?? "Shelved" : "Not shelved"}</span>
            </div>
            {canManage && (
              <div className="flex items-center gap-3">
                <select
                  value={copy.shelfId ?? ""}
                  onChange={(e) => handleReshelve(copy, e.target.value)}
                  disabled={editingId === copy.id}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Not shelved</option>
                  {shelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(copy)}
                  disabled={editingId === copy.id || copy.status === "ISSUED" || copy.status === "RESERVED"}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">No copies of this book yet.</p>}
      </div>
    </div>
  );
}
