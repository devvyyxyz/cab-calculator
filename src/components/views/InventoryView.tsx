"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { ItemDetailModal } from "@/components/trade/ItemDetailModal";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  SectionDivider,
  EmptyState,
  rarityTier,
} from "@/lib/trade-utils";
import { InventoryRotSlot } from "@/components/trade/InventoryRotSlot";
import { InventoryBagSlot } from "@/components/trade/InventoryBagSlot";
import { usePersistentState } from "@/components/trade/usePersistentState";
import { classifyItem } from "@/lib/trade-values";
import type { Rot, PlayerData, Species, BagItemInfo } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";

export function InventoryView() {
  const state = useAppState();

  const [tab, setTab] = useState<"team" | "pc" | "bag">("team");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"rarity-asc" | "rarity-desc" | "name-az" | "name-za" | "level-asc" | "level-desc">("cab_sort_inventory", "rarity-desc");

  const [detailRot, setDetailRot] = useState<Rot | null>(null);
  const [detailBag, setDetailBag] = useState<{ name: string; info: BagItemInfo; qty: number } | null>(null);

  if (!state.youProfile) {
    return (
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          COMPLETE ONBOARDING FIRST
        </p>
      </div>
    );
  }

  if (state.loading === "you" && !state.yourData) {
    return (
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          LOADING INVENTORY...
        </p>
      </div>
    );
  }

  if (!state.yourData) {
    return (
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p
          className="text-outline mb-3 text-base text-white"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          NO INVENTORY FOUND
        </p>
        <p className="mx-auto max-w-md text-[10px] text-white/70">
          Your Roblox account doesn&apos;t have a Catch a Brainrot save yet.
          Play the game and come back, or use the catalog picker on the trade view.
        </p>
      </div>
    );
  }

  const sortRots = (arr: Rot[]) =>
    [...arr].sort((a, b) => {
      const spA = state.rotsData[a.Species];
      const spB = state.rotsData[b.Species];
      const rA = spA?.Rarity ?? 0;
      const rB = spB?.Rarity ?? 0;
      switch (sortBy) {
        case "rarity-asc":
          return rA - rB || (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "rarity-desc":
          return rB - rA || (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "name-az":
          return (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "name-za":
          return (b.Nickname || b.Species).localeCompare(a.Nickname || a.Species);
        case "level-asc":
          return a.Level - b.Level;
        case "level-desc":
          return b.Level - a.Level;
        default:
          return 0;
      }
    });

  const teamRots = sortRots(
    state.yourData.Team.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const pcRots = sortRots(
    state.yourData.PC.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const bagEntries = Object.entries(state.yourData.Bag)
    .filter(([name, q]) => q > 0 && name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name-az") return a[0].localeCompare(b[0]);
      if (sortBy === "name-za") return b[0].localeCompare(a[0]);
      return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
    });
  const currentRots = tab === "team" ? teamRots : pcRots;

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          INVENTORY
        </h2>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search inventory..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          options={
            tab === "bag"
              ? [
                  { value: "rarity-asc", label: "Type" },
                  { value: "name-az", label: "Name A-Z" },
                  { value: "name-za", label: "Name Z-A" },
                ]
              : [
                  { value: "rarity-asc", label: "Rarity ↑" },
                  { value: "rarity-desc", label: "Rarity ↓" },
                  { value: "name-az", label: "Name A-Z" },
                  { value: "name-za", label: "Name Z-A" },
                  { value: "level-asc", label: "Level ↑" },
                  { value: "level-desc", label: "Level ↓" },
                ]
          }
        />
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap justify-center gap-2">
        {([
          { id: "team", icon: "backpack", label: `TEAM (${teamRots.length})` },
          { id: "pc", icon: "book-open", label: `PC (${pcRots.length})` },
          { id: "bag", icon: "fire", label: `BAG (${bagEntries.length})` },
        ] as const).map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="stud-input flex items-center gap-2 px-3 py-2 text-[10px] uppercase transition-all"
              style={{
                color: isActive ? "#1e3a5f" : "#374151",
                fontFamily: "var(--font-pixel), monospace",
                borderRadius: "0.875rem",
                background: isActive
                  ? "rgba(124,179,255,0.6)"
                  : undefined,
              }}
            >
              <PixelIcon
                name={t.icon}
                size={16}
                color={isActive ? "#1e3a5f" : "#6b7280"}
              />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {tab === "bag" ? (
          <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
            {(() => {
              if (bagEntries.length === 0) {
                return <EmptyState text="No bag items" />;
              }
              if (sortBy !== "name-az" && sortBy !== "name-za") {
                const sections: { label: string; items: typeof bagEntries }[] = [];
                for (const entry of bagEntries) {
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
                    {section.items.map(([name, qty]) => (
                      <InventoryBagSlot key={name} name={name} qty={qty} info={state.bagData[name]} onClick={() => setDetailBag({ name, info: state.bagData[name], qty })} />
                    ))}
                  </div>
                ));
              }
              if (sortBy === "name-az" || sortBy === "name-za") {
                const sections: { label: string; items: typeof bagEntries }[] = [];
                for (const entry of bagEntries) {
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
                    {section.items.map(([name, qty]) => (
                      <InventoryBagSlot key={name} name={name} qty={qty} info={state.bagData[name]} onClick={() => setDetailBag({ name, info: state.bagData[name], qty })} />
                    ))}
                  </div>
                ));
              }
              return bagEntries.map(([name, qty]) => (
                <InventoryBagSlot key={name} name={name} qty={qty} info={state.bagData[name]} onClick={() => setDetailBag({ name, info: state.bagData[name], qty })} />
              ));
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
            {(() => {
              if (currentRots.length === 0) {
                return <EmptyState text={`No ${tab === "team" ? "team" : "PC"} rots`} />;
              }
              if (sortBy === "rarity-asc" || sortBy === "rarity-desc") {
                const sections: { label: string; color: string; items: Rot[] }[] = [];
                for (const rot of currentRots) {
                  const sp = state.rotsData[rot.Species];
                  const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
                  let section = sections.find((s) => s.label === tier.label);
                  if (!section) {
                    section = { label: tier.label, color: tier.color, items: [] };
                    sections.push(section);
                  }
                  section.items.push(rot);
                }
                return sections.map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} color={section.color} />
                    {section.items.map((rot) => (
                      <InventoryRotSlot key={rot.UID} rot={rot} sp={state.rotsData[rot.Species]} onClick={() => setDetailRot(rot)} />
                    ))}
                  </div>
                ));
              }
              if (sortBy === "name-az" || sortBy === "name-za") {
                const sections: { label: string; items: Rot[] }[] = [];
                for (const rot of currentRots) {
                  const name = rot.Nickname || rot.Species;
                  const letter = (name[0] || "#").toUpperCase();
                  const label = /[A-Z]/.test(letter) ? letter : "#";
                  let section = sections.find((s) => s.label === label);
                  if (!section) {
                    section = { label, items: [] };
                    sections.push(section);
                  }
                  section.items.push(rot);
                }
                return sections.map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} />
                    {section.items.map((rot) => (
                      <InventoryRotSlot key={rot.UID} rot={rot} sp={state.rotsData[rot.Species]} onClick={() => setDetailRot(rot)} />
                    ))}
                  </div>
                ));
              }
              return currentRots.map((rot) => (
                <InventoryRotSlot key={rot.UID} rot={rot} sp={state.rotsData[rot.Species]} onClick={() => setDetailRot(rot)} />
              ));
            })()}
          </div>
        )}
      </div>

      {(detailRot || detailBag) && (
        <ItemDetailModal
          rot={detailRot ?? undefined}
          species={detailRot ? state.rotsData[detailRot.Species] : undefined}
          bagItem={detailBag ?? undefined}
          onClose={() => {
            setDetailRot(null);
            setDetailBag(null);
          }}
        />
      )}

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
