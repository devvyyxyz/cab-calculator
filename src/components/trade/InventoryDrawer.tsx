"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { usePersistentState } from "@/components/trade/usePersistentState";
import { SmartImage } from "@/components/trade/SmartImage";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";
import { CatalogRotSlot } from "@/components/trade/CatalogRotSlot";
import {
  iconUrl,
} from "@/lib/cab-client";
import type { Rot, Species, BagItemInfo, PlayerData } from "@/lib/cab-types";
import {
  classifyItem,
} from "@/lib/trade-values";
import {
  rarityTier,
  SectionDivider,
  EmptyState,
} from "@/lib/trade-utils";

const SLOTS_PER_PANEL = 12;

export function InventoryDrawer({
  side,
  data,
  rotsData,
  bagData,
  onClose,
  onAddRot,
  onAddItem,
  onAddCatalogRot,
  offerRots,
  offerItems,
}: {
  side: "you" | "them";
  data: PlayerData | null;
  rotsData: Record<string, Species>;
  bagData: Record<string, BagItemInfo>;
  onClose: () => void;
  onAddRot: (rot: Rot) => void;
  onAddItem: (name: string, qty: number) => void;
  onAddCatalogRot?: (speciesName: string) => void;
  offerRots: Rot[];
  offerItems: { name: string; qty: number }[];
}) {
  const catalogMode = side === "them" && !data;
  const [tab, setTab] = useState<"team" | "pc" | "bag" | "rots" | "items">(
    catalogMode ? "rots" : "team"
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<
    "rarity-desc" | "rarity-asc" | "name-az" | "name-za"
  >("cab_sort_modal", "rarity-desc");
  const [tick, setTick] = useState<string | null>(null);

  const triggerTick = useCallback((id: string) => {
    setTick(null);
    requestAnimationFrame(() => setTick(id));
    setTimeout(() => setTick(null), 600);
  }, []);

  const accent = side === "you" ? "#7cb3ff" : "#7ed957";
  const accentBorder = side === "you" ? "#1e3a5f" : "#2e5a1f";

  const sortRotsList = (arr: Rot[]) =>
    [...arr].sort((a, b) => {
      const spA = rotsData[a.Species];
      const spB = rotsData[b.Species];
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
        default:
          return 0;
      }
    });

  function groupRots<T extends Rot>(rots: T[]): { label: string; color?: string; items: T[] }[] {
    if (sortBy === "name-az" || sortBy === "name-za") {
      const sections: { label: string; items: T[] }[] = [];
      for (const rot of rots) {
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
      return sections;
    }
    const sections: { label: string; color: string; items: T[] }[] = [];
    for (const rot of rots) {
      const sp = rotsData[rot.Species];
      const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
      let section = sections.find((s) => s.label === tier.label);
      if (!section) {
        section = { label: tier.label, color: tier.color, items: [] };
        sections.push(section);
      }
      section.items.push(rot);
    }
    return sections;
  }

  function groupBag<T extends [string, any]>(entries: T[]): { label: string; items: T[] }[] {
    if (sortBy === "name-az" || sortBy === "name-za") {
      const sections: { label: string; items: T[] }[] = [];
      for (const entry of entries) {
        const letter = (entry[0][0] || "#").toUpperCase();
        const label = /[A-Z]/.test(letter) ? letter : "#";
        let section = sections.find((s) => s.label === label);
        if (!section) {
          section = { label, items: [] };
          sections.push(section);
        }
        section.items.push(entry);
      }
      return sections;
    }
    const sections: { label: string; items: T[] }[] = [];
    for (const entry of entries) {
      const tier = classifyItem(entry[0]).tier;
      let section = sections.find((s) => s.label === tier);
      if (!section) {
        section = { label: tier, items: [] };
        sections.push(section);
      }
      section.items.push(entry);
    }
    return sections;
  }

  if (catalogMode) {
    const allSpecies = Object.entries(rotsData);
    const allBag = Object.entries(bagData);
    const filteredSpecies = allSpecies
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
    const filteredBag = allBag
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "name-az") return a[0].localeCompare(b[0]);
        if (sortBy === "name-za") return b[0].localeCompare(a[0]);
        return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
      });

    return (
      <div
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
          style={{
            backgroundColor: "#1a1f2e",
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "40px 40px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "soft-light",
            boxShadow: `0 -4px 0 ${accentBorder}, inset 0 2px 0 rgba(255,255,255,0.1)`,
            border: `4px solid ${accentBorder}`,
          }}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
            style={{ background: accent, borderBottom: `3px solid ${accentBorder}` }}
          >
            <div>
              <h3
                className="text-outline text-sm text-white sm:text-base"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                THEIR ITEMS - CATALOG
              </h3>
            </div>
            <button
              onClick={onClose}
              className="btn-follow grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white"
              style={{ boxShadow: "0 3px 0 #7f1d1d" }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-white/10 px-4 py-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search..."
              className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
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

          <div className="flex shrink-0 flex-wrap justify-center gap-2 border-b border-white/10 px-4 py-2">
            {([
              { id: "rots", icon: "book-open", label: `ROTS (${allSpecies.length})` },
              { id: "items", icon: "fire", label: `ITEMS (${allBag.length})` },
            ] as const).map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="stud-input flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase transition-all"
                  style={{
                    color: isActive ? "#1e3a5f" : "#374151",
                    fontFamily: "var(--font-pixel), monospace",
                    borderRadius: "0.875rem",
                    background: isActive ? "rgba(124,179,255,0.6)" : undefined,
                  }}
                >
                  <PixelIcon
                    name={t.icon}
                    size={14}
                    color={isActive ? "#1e3a5f" : "#6b7280"}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {tab === "items" ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {filteredBag.length === 0 ? (
                  <EmptyState text="No items match your search" />
                ) : (
                  groupBag(filteredBag).map((section) => (
                    <div key={section.label} className="contents">
                      <SectionDivider label={section.label} />
                      {section.items.map(([name, _qty]) => {
                        const info = bagData[name];
                        const tickId = "item-" + name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => { onAddItem(name, 1); triggerTick(tickId); }}
                            className="group relative aspect-square cursor-pointer"
                            style={{
                              background: "#374151",
                              borderRadius: "1.25rem",
                              boxShadow:
                                "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
                            }}
                            title={name}
                          >
                            <SmartImage
                              src={info?.Icon ? iconUrl(info.Icon) : ""}
                              alt={name}
                              imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                              fallbackSize={32}
                            />
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                              {name}
                            </div>
                            {tick === tickId && (
                              <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
                                <PixelIcon name="check" size={32} color="#ffffff" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {filteredSpecies.length === 0 ? (
                  <EmptyState text="No rots match your search" />
                ) : (
                  (() => {
                    if (sortBy === "name-az" || sortBy === "name-za") {
                      const sections: { label: string; items: typeof filteredSpecies }[] = [];
                      for (const entry of filteredSpecies) {
                        const letter = (entry[1].FullName[0] || "#").toUpperCase();
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
                          {section.items.map(([name, sp]) => (
                            <CatalogRotSlot key={name} name={name} sp={sp} onAdd={onAddCatalogRot} onTick={triggerTick} isTicking={tick === "catalog-" + name} />
                          ))}
                        </div>
                      ));
                    }
                    const sections: { label: string; color: string; items: typeof filteredSpecies }[] = [];
                    for (const entry of filteredSpecies) {
                      const tier = rarityTier(entry[1].Rarity, entry[1].IsExclusive);
                      let section = sections.find((s) => s.label === tier.label);
                      if (!section) {
                        section = { label: tier.label, color: tier.color, items: [] };
                        sections.push(section);
                      }
                      section.items.push(entry);
                    }
                    return sections.map((section) => (
                      <div key={section.label} className="contents">
                        <SectionDivider label={section.label} color={section.color} />
                        {section.items.map(([name, sp]) => (
                          <CatalogRotSlot key={name} name={name} sp={sp} onAdd={onAddCatalogRot} onTick={triggerTick} isTicking={tick === "catalog-" + name} />
                        ))}
                      </div>
                    ));
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allRots = [...data.Team, ...data.PC];
  const teamRots = sortRotsList(
    data.Team.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const pcRots = sortRotsList(
    data.PC.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const bagEntries = Object.entries(data.Bag)
    .filter(([name, q]) => q > 0 && name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name-az") return a[0].localeCompare(b[0]);
      if (sortBy === "name-za") return b[0].localeCompare(a[0]);
      return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
    });

  const isRotInOffer = (uid: string) =>
    offerRots.some((r) => r.UID === uid);
  const itemQtyInOffer = (name: string) =>
    offerItems.find((i) => i.name === name)?.qty ?? 0;

  const currentRots = tab === "team" ? teamRots : pcRots;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
        style={{
          backgroundColor: "#1a1f2e",
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "40px 40px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "soft-light",
          boxShadow: `0 -4px 0 ${accentBorder}, inset 0 2px 0 rgba(255,255,255,0.1)`,
          border: `4px solid ${accentBorder}`,
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
          style={{ background: accent, borderBottom: `3px solid ${accentBorder}` }}
        >
          <div>
            <h3
              className="text-outline text-sm text-white sm:text-base"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {side === "you" ? "YOUR" : "THEIR"} INVENTORY
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-follow grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white"
            style={{ boxShadow: "0 3px 0 #7f1d1d" }}
            aria-label="Close inventory"
          >
            ✕
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-white/10 px-4 py-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search..."
            className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
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

        <div className="flex shrink-0 flex-wrap justify-center gap-2 border-b border-white/10 px-4 py-2">
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
                className="stud-input flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase transition-all"
                style={{
                  color: isActive ? "#1e3a5f" : "#374151",
                  fontFamily: "var(--font-pixel), monospace",
                  borderRadius: "0.875rem",
                  background: isActive ? "rgba(124,179,255,0.6)" : undefined,
                }}
              >
                <PixelIcon
                  name={t.icon}
                  size={14}
                  color={isActive ? "#1e3a5f" : "#6b7280"}
                />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {tab === "bag" ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {bagEntries.length === 0 ? (
                <EmptyState text="No bag items match your search" />
              ) : (
                groupBag(bagEntries).map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} />
                    {section.items.map(([name, qty]) => {
                      const inOffer = itemQtyInOffer(name);
                      const info = bagData[name];
                      const remaining = qty - inOffer;
                      const tickId = "invitem-" + name;
                      return (
                        <button
                          key={name}
                          type="button"
                          disabled={remaining <= 0}
                          onClick={() => { onAddItem(name, 1); triggerTick(tickId); }}
                          className="group relative aspect-square cursor-pointer disabled:opacity-40"
                          style={{
                            background: "#374151",
                            borderRadius: "1.25rem",
                            boxShadow:
                              "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
                          }}
                          title={`${name} ×${qty}`}
                        >
                          <SmartImage
                            src={info?.Icon ? iconUrl(info.Icon) : ""}
                            alt={name}
                            imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                            fallbackSize={32}
                          />
                          {qty > 1 && (
                            <span
                              className="text-outline-sm absolute bottom-0.5 right-0.5 text-xs text-white"
                              style={{
                                fontFamily: "var(--font-pixel), monospace",
                              }}
                            >
                              ×{qty}
                            </span>
                          )}
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                            {name}
                          </div>
                          {tick === tickId && (
                            <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
                              <PixelIcon name="check" size={32} color="#ffffff" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {currentRots.length === 0 ? (
                <EmptyState text={`No ${tab === "team" ? "team" : "PC"} rots match your search`} />
              ) : (
                groupRots(currentRots).map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} color={section.color} />
                    {section.items.map((rot) => {
                      const sp = rotsData[rot.Species];
                      const inOffer = isRotInOffer(rot.UID);
                      const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
                      const tickId = "rot-" + rot.UID;
                      return (
                        <button
                          key={rot.UID}
                          type="button"
                          disabled={inOffer}
                          onClick={() => { onAddRot(rot); triggerTick(tickId); }}
                          className={`group relative aspect-square cursor-pointer disabled:opacity-40 ${tier.shimmer ? "shimmer-rare" : ""}`}
                          style={{
                            background: tier.color,
                            borderRadius: "1.25rem",
                            boxShadow:
                              "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
                          }}
                          title={rot.Nickname || rot.Species}
                        >
                          <SmartImage
                            src={sp?.Icon ? iconUrl(sp.Icon) : ""}
                            alt={rot.Species}
                            imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                            fallbackSize={32}
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                            {rot.Nickname || rot.Species}
                          </div>
                          {tick === tickId && (
                            <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
                              <PixelIcon name="check" size={32} color="#ffffff" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
