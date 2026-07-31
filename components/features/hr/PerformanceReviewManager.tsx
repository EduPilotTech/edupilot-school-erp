"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPerformanceReviewAction } from "@/app/hr/actions";
import type { PerformanceReviewDTO } from "@/modules/hr/application/dto/performance-review.dto";

interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode: string;
}

interface PerformanceReviewManagerProps {
  items: PerformanceReviewDTO[];
  employeeOptions: EmployeeOption[];
  canManage: boolean;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

// Create + list only — a performance review is an immutable historical record per
// modules/hr/application/performance-review.service.ts's own comment ("append-only, mirroring
// MarksEntry/FeeAuditLog"). No edit/delete row actions, unlike DepartmentManager/LeaveTypeManager.
export function PerformanceReviewManager({ items, employeeOptions, canManage }: PerformanceReviewManagerProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(employeeOptions[0]?.id ?? "");
  const [reviewPeriodStart, setReviewPeriodStart] = useState("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState("");
  const [rating, setRating] = useState("5");
  const [remarks, setRemarks] = useState("");
  const [promotionRecommended, setPromotionRecommended] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function employeeName(id: string): string {
    const option = employeeOptions.find((e) => e.id === id);
    return option ? `${option.fullName} (${option.employeeCode})` : id;
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createPerformanceReviewAction({
        employeeId,
        reviewPeriodStart,
        reviewPeriodEnd,
        rating: Number(rating),
        remarks: remarks || undefined,
        promotionRecommended,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setReviewPeriodStart("");
      setReviewPeriodEnd("");
      setRating("5");
      setRemarks("");
      setPromotionRecommended(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">New Performance Review</h2>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="review-employee" className="text-xs font-medium text-zinc-500">
                  Employee
                </label>
                <select
                  id="review-employee"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="review-period-start" className="text-xs font-medium text-zinc-500">
                  Period Start
                </label>
                <input
                  id="review-period-start"
                  type="date"
                  value={reviewPeriodStart}
                  onChange={(e) => setReviewPeriodStart(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="review-period-end" className="text-xs font-medium text-zinc-500">
                  Period End
                </label>
                <input
                  id="review-period-end"
                  type="date"
                  value={reviewPeriodEnd}
                  onChange={(e) => setReviewPeriodEnd(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="review-rating" className="text-xs font-medium text-zinc-500">
                  Rating
                </label>
                <select
                  id="review-rating"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {RATING_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pb-1.5">
                <input
                  id="review-promotion"
                  type="checkbox"
                  checked={promotionRecommended}
                  onChange={(e) => setPromotionRecommended(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                />
                <label htmlFor="review-promotion" className="text-sm text-zinc-700">
                  Promotion Recommended
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="review-remarks" className="text-xs font-medium text-zinc-500">
                Remarks
              </label>
              <textarea
                id="review-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Performance summary, strengths, areas for improvement…"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting || !employeeId || !reviewPeriodStart || !reviewPeriodEnd}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Save Review"}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Rating</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Remarks</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Promotion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((review) => (
              <tr key={review.id}>
                <td className="px-4 py-2 text-zinc-900">{employeeName(review.employeeId)}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {review.reviewPeriodStart} — {review.reviewPeriodEnd}
                </td>
                <td className="px-4 py-2 text-zinc-700">{review.rating} / 5</td>
                <td className="max-w-[280px] truncate px-4 py-2 text-zinc-700" title={review.remarks ?? undefined}>
                  {review.remarks ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700">{review.promotionRecommended ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No performance reviews recorded yet.</p>}
      </div>
    </div>
  );
}
