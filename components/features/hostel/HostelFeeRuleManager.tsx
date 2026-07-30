"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHostelFeeRuleAction, updateHostelFeeRuleAction, deleteHostelFeeRuleAction } from "@/app/hostel/actions";
import type { HostelFeeRuleDTO } from "@/modules/hostel/application/dto/hostel-fee-rule.dto";
import type { HostelDTO } from "@/modules/hostel/application/dto/hostel.dto";
import type { FeeCategoryDTO } from "@/modules/fees/application/dto/fee-category.dto";

interface HostelFeeRuleManagerProps {
  academicSessionId: string;
  items: HostelFeeRuleDTO[];
  hostels: HostelDTO[];
  feeCategories: FeeCategoryDTO[];
  defaultHostelId?: string;
  canManage: boolean;
}

const ROOM_TYPES = ["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY", "OTHER"];
const FREQUENCIES = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "ONE_TIME", "INSTALLMENT"];

// HostelFeeRule is the hostel analogue of RouteFeeRule — amount keyed by (Hostel, RoomType)
// instead of Route. Only MONTHLY rules are picked up by the bulk invoice generator; ONE_TIME
// rules (Security Deposit, Fine) are generated per-student on the same page below.
export function HostelFeeRuleManager({
  academicSessionId,
  items,
  hostels,
  feeCategories,
  defaultHostelId,
  canManage,
}: HostelFeeRuleManagerProps) {
  const router = useRouter();
  const [hostelId, setHostelId] = useState(defaultHostelId ?? hostels[0]?.id ?? "");
  const [roomType, setRoomType] = useState("DOUBLE");
  const [feeCategoryId, setFeeCategoryId] = useState(feeCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function hostelName(id: string) {
    return hostels.find((h) => h.id === id)?.name ?? id;
  }
  function categoryName(id: string) {
    return feeCategories.find((c) => c.id === id)?.name ?? id;
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createHostelFeeRuleAction({
        hostelId,
        roomType,
        academicSessionId,
        feeCategoryId,
        amount: Number(amount),
        frequency,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setAmount("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(rule: HostelFeeRuleDTO) {
    setEditingId(rule.id);
    setError(null);
    try {
      const result = await updateHostelFeeRuleAction(rule.id, { isActive: !rule.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(rule: HostelFeeRuleDTO) {
    setEditingId(rule.id);
    setError(null);
    try {
      const result = await deleteHostelFeeRuleAction(rule.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-rule-hostel" className="text-xs font-medium text-zinc-500">
              Hostel
            </label>
            <select
              id="hostel-rule-hostel"
              value={hostelId}
              onChange={(e) => setHostelId(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-rule-roomtype" className="text-xs font-medium text-zinc-500">
              Room Type
            </label>
            <select
              id="hostel-rule-roomtype"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-rule-category" className="text-xs font-medium text-zinc-500">
              Fee Category
            </label>
            <select
              id="hostel-rule-category"
              value={feeCategoryId}
              onChange={(e) => setFeeCategoryId(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {feeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-rule-amount" className="text-xs font-medium text-zinc-500">
              Amount
            </label>
            <input
              id="hostel-rule-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-rule-frequency" className="text-xs font-medium text-zinc-500">
              Frequency
            </label>
            <select
              id="hostel-rule-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !hostelId || !feeCategoryId || !amount}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Add Fee Rule"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Hostel</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Room Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Fee Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Frequency</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{hostelName(rule.hostelId)}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.roomType}</td>
                <td className="px-4 py-2 text-zinc-700">{categoryName(rule.feeCategoryId)}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.frequency.replaceAll("_", " ")}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule)}
                      disabled={editingId === rule.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {rule.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rule)}
                      disabled={editingId === rule.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No fee rules yet.</p>}
      </div>
    </div>
  );
}
