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

// Sprint 4.8C — lightweight, dependency-free tab switcher (local useState, no routing/URL
// state) so the Student Profile page can host a "Documents" tab alongside the existing
// Overview content, without a full page redesign. Server Component content (the existing cards)
// is rendered by the caller and passed in as each tab's `content` — a Client Component
// receiving already-rendered Server Component output as a prop is a standard, supported RSC
// pattern, not a client/server boundary violation.
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
