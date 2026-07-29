"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHomeworkAction } from "@/app/communication/actions";
import type { HomeworkDTO } from "@/modules/communication/application/dto/homework.dto";

interface Option {
  id: string;
  name: string;
}

interface HomeworkManagerProps {
  academicSessionId: string;
  items: HomeworkDTO[];
  classes: Option[];
  sections: Option[];
  subjects: Option[];
  canManage: boolean;
}

function optionName(options: Option[], id: string | null): string {
  if (!id) return "Whole class";
  return options.find((option) => option.id === id)?.name ?? id;
}

// Homework (requirement 12) — view-only for parents (Decision 3), full CRUD for the assigning
// teacher.
export function HomeworkManager({ academicSessionId, items, classes, sections, subjects, canManage }: HomeworkManagerProps) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createHomeworkAction({
        academicSessionId,
        classId,
        sectionId: sectionId || undefined,
        subjectId,
        title,
        description,
        assignedDate: new Date().toISOString().slice(0, 10),
        dueDate,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setTitle("");
      setDescription("");
      setDueDate("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="hw-class" className="text-xs font-medium text-zinc-500">
                Class
              </label>
              <select id="hw-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
                {classes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hw-section" className="text-xs font-medium text-zinc-500">
                Section (optional)
              </label>
              <select id="hw-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
                <option value="">Whole class</option>
                {sections.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hw-subject" className="text-xs font-medium text-zinc-500">
                Subject
              </label>
              <select id="hw-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
                {subjects.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hw-due" className="text-xs font-medium text-zinc-500">
                Due Date
              </label>
              <input id="hw-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !title || !description || !dueDate}
            className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Assigning…" : "Assign Homework"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">{item.title}</h2>
              <span className="text-xs text-zinc-500">
                {optionName(classes, item.classId)} · {optionName(sections, item.sectionId)} · due {item.dueDate}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-700">{item.description}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">No homework assigned yet.</p>}
      </div>
    </div>
  );
}
