"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  SectionDivider,
  EmptyState,
} from "@/lib/trade-utils";
import { ItemSlot } from "@/components/trade/ItemSlot";
import { classifyItem } from "@/lib/trade-values";
import type { BagItemInfo } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";

export function ItemsView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"type" | "name-az" | "name-za">("cab_sort_items", "name-za");

  const items = Object.entries(state.bagData);
  const filtered = items
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "type": {
          const ta = classifyItem(a[0]).tier;
          const tb = classifyItem(b[0]).tier;
          return ta.localeCompare(tb) || a[0].localeCompare(b[0]);
        }
        case "name-az":
          return a[0].localeCompare(b[0]);
        case "name-za":
          return b[0].localeCompare(a[0]);
        default:
          return 0;
      }
    });

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          ITEMS
        </h2>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search items..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "type", label: "Type" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
          {(() => {
            if (filtered.length === 0) {
              return <EmptyState text="No items match your search" />;
            }
            if (sortBy === "type") {
              const sections: { label: string; items: typeof filtered }[] = [];
              for (const entry of filtered) {
                const tier = classifyItem(entry[0]).tier;
                let section = sections.find((s) => s.label === tier);
                if (!section) {
                  section = { label: tier, items: [] };
                  sections.push(section);
                }
                section.items.push(entry);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} />
                  {section.items.map(([name, info]) => (
                    <ItemSlot key={name} name={name} info={info} />
                  ))}
                </div>
              ));
            }
            if (sortBy === "name-az" || sortBy === "name-za") {
              const sections: { label: string; items: typeof filtered }[] = [];
              for (const entry of filtered) {
                const letter = (entry[0][0] || "#").toUpperCase();
                const label = /[A-Z]/.test(letter) ? letter : "#";
                let section = sections.find((s) => s.label === label);
                if (!section) {
                  section = { label, items: [] };
                  sections.push(section);
                }
                section.items.push(entry);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} />
                  {section.items.map(([name, info]) => (
                    <ItemSlot key={name} name={name} info={info} />
                  ))}
                </div>
              ));
            }
            return filtered.map(([name, info]) => (
              <ItemSlot key={name} name={name} info={info} />
            ));
          })()}
        </div>
      </div>

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
