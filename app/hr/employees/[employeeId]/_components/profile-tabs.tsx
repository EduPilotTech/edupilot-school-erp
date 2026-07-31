"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ProfileTabsProps {
  tabs: Tab[];
}

// Duplicated from app/students/[studentId]/_components/profile-tabs.tsx rather than imported
// cross-route, matching each route's private `_components` colocation convention — a
// lightweight, dependency-free tab switcher (local useState, no routing/URL state) so the
// Employee Profile page can host Overview / Bank Details / Documents tabs without a full page
// redesign.
export function ProfileTabs({ tabs }: ProfileTabsProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab?.id}
            onClick={() => setActiveId(tab.id)}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab.id === activeTab?.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="pt-6">
        {activeTab?.content}
      </div>
    </div>
  );
}
