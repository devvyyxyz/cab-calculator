"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  SectionDivider,
  LegendChip,
  EmptyState,
  rarityTier,
} from "@/lib/trade-utils";
import { BrainrotSlot } from "@/components/trade/BrainrotSlot";
import type { Species } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";

export function BrainrotsView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"rarity-asc" | "rarity-desc" | "name-az" | "name-za">("cab_sort_rots", "rarity-desc");

  const species = Object.entries(state.rotsData);
  const filtered = species
    .filter(([name, sp]) =>
      `${name} ${sp.ShortenedName} ${sp.FullName}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rarity-asc":
          return a[1].Rarity - b[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
        case "rarity-desc":
          return b[1].Rarity - a[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
        case "name-az":
          return a[1].FullName.localeCompare(b[1].FullName);
        case "name-za":
          return b[1].FullName.localeCompare(a[1].FullName);
        default:
          return 0;
      }
    });

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          BRAINROTS
        </h2>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search brainrots..."
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
            { value: "rarity-desc", label: "Rarity ↓" },
            { value: "rarity-asc", label: "Rarity ↑" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
          {(() => {
            if (filtered.length === 0) {
              return <EmptyState text="No brainrots match your search" />;
            }
            if (sortBy === "rarity-asc" || sortBy === "rarity-desc") {
              const sections: { label: string; color: string; items: typeof filtered }[] = [];
              for (const [name, sp] of filtered) {
                const tier = rarityTier(sp.Rarity, sp.IsExclusive);
                let section = sections.find((s) => s.label === tier.label);
                if (!section) {
                  section = { label: tier.label, color: tier.color, items: [] };
                  sections.push(section);
                }
                section.items.push([name, sp]);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} color={section.color} />
                  {section.items.map(([name, sp]) => (
                    <BrainrotSlot key={name} name={name} sp={sp} />
                  ))}
                </div>
              ));
            }
            if (sortBy === "name-az" || sortBy === "name-za") {
              const sections: { label: string; items: typeof filtered }[] = [];
              for (const [name, sp] of filtered) {
                const letter = (sp.FullName[0] || "#").toUpperCase();
                const label = /[A-Z]/.test(letter) ? letter : "#";
                let section = sections.find((s) => s.label === label);
                if (!section) {
                  section = { label, items: [] };
                  sections.push(section);
                }
                section.items.push([name, sp]);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} />
                  {section.items.map(([name, sp]) => (
                    <BrainrotSlot key={name} name={name} sp={sp} />
                  ))}
                </div>
              ));
            }
            return filtered.map(([name, sp]) => (
              <BrainrotSlot key={name} name={name} sp={sp} />
            ));
          })()}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[9px] text-white/80">
          <LegendChip color="#E5E7EB" label="Common" />
          <LegendChip color="#FCA5A5" label="Uncommon" />
          <LegendChip color="#7ED957" label="Rare" />
          <LegendChip color="#B27DFF" label="Epic" />
          <LegendChip color="#AA33FF" label="Insane" />
          <LegendChip color="#FF5555" label="Exclusive" />
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
