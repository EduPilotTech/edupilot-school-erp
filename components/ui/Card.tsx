import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

// Section container used throughout the Admission form — one Card per logical group (Student
// Information, Academic Information, ...), matching the "group every section" requirement.
export function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}
