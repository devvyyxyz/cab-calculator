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
import { iconUrl } from "@/lib/cab-client";
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
      <div className="relative mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          COMPLETE ONBOARDING FIRST
        </p>
      </div>
    );
  }

  if (state.loading === "you" && !state.yourData) {
    return (
      <div className="relative mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          LOADING INVENTORY...
        </p>
      </div>
    );
  }

  if (!state.yourData) {
    return (
      <div className="relative mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p
          className="text-outline mb-3 text-base text-white"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          NO INVENTORY FOUND
        </p>
        <p className="mx-auto max-w-md text-[10px] text-white/70">
          Your Roblox account doesn&apos;t have a Catch a Brainrot RotDex save yet.
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
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6">
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="mb-4 flex flex-col items-center gap-2 pt-4">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            INVENTORY
          </h2>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
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

      <div className="mb-4 flex flex-wrap justify-center gap-2">
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
        ) : tab === "team" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(() => {
              if (teamRots.length === 0) {
                return <EmptyState text="No team rots" />;
              }
              return teamRots.map((rot) => {
                const sp = state.rotsData[rot.Species];
                const name = rot.Nickname || rot.Species;
                const health = sp?.Health ?? 0;
                const maxHealth = 500;
                const healthPercent = Math.min(100, Math.max(0, (health / maxHealth) * 100));
                const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
                return (
                  <div
                    key={rot.UID}
                    className="flex items-center gap-3 rounded-xl border border-black/20 p-3 shadow-sm"
                    style={{
                      background: tier.color,
                      backgroundImage: "url('/stud_texture.png')",
                      backgroundSize: "30px 30px",
                      backgroundRepeat: "repeat",
                      backgroundBlendMode: "overlay",
                    }}
                    onClick={() => setDetailRot(rot)}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl p-1">
                      <SmartImage
                        src={sp?.Icon ? iconUrl(sp.Icon) : ""}
                        alt={rot.Species}
                        imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                        fallbackSize={32}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold uppercase tracking-wide text-white">
                        {name}
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex flex-1 items-center gap-2">
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/20">
                            <div
                              className="h-full rounded-full bg-green-400"
                              style={{ width: `${healthPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-white/90">{health.toFixed(0)}</span>
                        </div>
                        <div className="text-xs text-white/80">
                          lvl <span className="font-bold text-white">{rot.Level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
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
