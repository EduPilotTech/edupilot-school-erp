"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMessMealAction, updateMessMealAction, deleteMessMealAction } from "@/app/hostel/actions";
import type { MessMealDTO } from "@/modules/hostel/application/dto/mess.dto";

interface MessMealManagerProps {
  mealPlanId: string;
  items: MessMealDTO[];
  canManage: boolean;
}

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];
const DIET_TYPES = ["VEG", "NON_VEG", "JAIN", "VEGAN", "OTHER"];

export function MessMealManager({ mealPlanId, items, canManage }: MessMealManagerProps) {
  const router = useRouter();
  const [mealType, setMealType] = useState("BREAKFAST");
  const [dietType, setDietType] = useState("VEG");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createMessMealAction({ mealPlanId, mealType, dietType, description: description || undefined });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setDescription("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(meal: MessMealDTO) {
    setEditingId(meal.id);
    setError(null);
    try {
      const result = await updateMessMealAction(meal.id, { isActive: !meal.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(meal: MessMealDTO) {
    setEditingId(meal.id);
    setError(null);
    try {
      const result = await deleteMessMealAction(meal.id);
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
            <label htmlFor="meal-type" className="text-xs font-medium text-zinc-500">
              Meal Type
            </label>
            <select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="diet-type" className="text-xs font-medium text-zinc-500">
              Diet Type
            </label>
            <select
              id="diet-type"
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {DIET_TYPES.map((diet) => (
                <option key={diet} value={diet}>
                  {diet.replace("_", "-")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="meal-description" className="text-xs font-medium text-zinc-500">
              Description
            </label>
            <input
              id="meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Idli, sambhar, chutney"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Meal"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Meal Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Diet Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Description</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((meal) => (
              <tr key={meal.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{meal.mealType}</td>
                <td className="px-4 py-2 text-zinc-700">{meal.dietType.replace("_", "-")}</td>
                <td className="px-4 py-2 text-zinc-700">{meal.description ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{meal.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(meal)}
                      disabled={editingId === meal.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {meal.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(meal)}
                      disabled={editingId === meal.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No meals yet.</p>}
      </div>
    </div>
  );
}
