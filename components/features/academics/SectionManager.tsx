"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSectionAction } from "@/app/academics/sections/actions";
import type { SectionDTO } from "@/modules/academics/application/dto/academic-section.dto";

interface ClassOption {
  id: string;
  name: string;
}

interface SectionManagerProps {
  items: SectionDTO[];
  classes: ClassOption[];
  canManage: boolean;
}

export function SectionManager({ items, classes, canManage }: SectionManagerProps) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createSectionAction({
        classId,
        name,
        capacity: capacity ? Number(capacity) : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setCapacity("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          {classes.length === 0 ? (
            <p className="text-sm text-zinc-500">Create a class first before adding sections.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="section-class" className="text-xs font-medium text-zinc-500">
                  Class
                </label>
                <select
                  id="section-class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {classes.map((classOption) => (
                    <option key={classOption.id} value={classOption.id}>
                      {classOption.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="section-name" className="text-xs font-medium text-zinc-500">
                  Section Name
                </label>
                <input
                  id="section-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="A"
                  className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="section-capacity" className="text-xs font-medium text-zinc-500">
                  Capacity (optional)
                </label>
                <input
                  id="section-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="40"
                  className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting || !name || !classId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Adding…" : "Add Section"}
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Section</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Capacity</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((section) => (
              <tr key={section.id}>
                <td className="px-4 py-2 text-zinc-900">{section.name}</td>
                <td className="px-4 py-2 text-zinc-700">{section.capacity ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{classNameById.get(section.classId) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No sections yet.</p>}
      </div>
    </div>
  );
}
