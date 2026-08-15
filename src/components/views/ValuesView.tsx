"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  SectionDivider,
  EmptyState,
  rarityTier,
} from "@/lib/trade-utils";
import { classifyItem, valueSpecies, type ValueMethod } from "@/lib/trade-values";
import type { Species, BagItemInfo, HoverboardInfo } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";
import { iconUrl } from "@/lib/cab-client";
import { CellularSignal0, CellularSignal1, CellularSignal2, CellularSignal3 } from "pixelarticons/react";

const DEMAND_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "very-low": CellularSignal0,
  low: CellularSignal1,
  medium: CellularSignal2,
  high: CellularSignal3,
};

const DEMAND_COLORS: Record<string, string> = {
  "very-low": "#ef4444",
  low: "#f97316",
  medium: "#a3e635",
  high: "#22c55e",
};

function DemandIcon({ demand }: { demand?: string }) {
  if (!demand) return null;
  const Icon = DEMAND_ICONS[demand] ?? CellularSignal2;
  const color = DEMAND_COLORS[demand] ?? "#9ca3af";
  return <Icon width={16} height={16} style={{ color }} />;
}

function hoverboardTier(speed: number): { tier: string; value: number } {
  if (speed >= 20) return { tier: "Legendary", value: 500 };
  if (speed >= 15) return { tier: "Epic", value: 300 };
  if (speed >= 10) return { tier: "Rare", value: 150 };
  if (speed >= 5) return { tier: "Uncommon", value: 80 };
  return { tier: "Common", value: 40 };
}

export function ValuesView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"rots" | "hoverboards" | "items" | "eggs" | "boxes">("rots");
  const [sortBy, setSortBy] = usePersistentState<"value-desc" | "value-asc" | "name-az" | "name-za">("cab_sort_values", "value-desc");
  const [method, setMethod] = useState<ValueMethod>(state.valueMethod);

  const rotValues = Object.entries(state.rotsData)
    .map(([name, sp]) => {
      const value = valueSpecies(sp, method);
      return { name, sp, value, tier: rarityTier(sp.Rarity, sp.IsExclusive) };
    })
    .filter((r) =>
      `${r.name} ${r.sp.ShortenedName} ${r.sp.FullName}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "value-asc":
          return a.value - b.value || a.name.localeCompare(b.name);
        case "value-desc":
          return b.value - a.value || a.name.localeCompare(b.name);
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const hoverboardValues = useMemo(() => {
    return Object.entries(state.hoverboardData)
      .map(([name, hb]) => {
        const { tier, value } = hoverboardTier(hb.Speed);
        return { name, info: hb, value, tier };
      })
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        switch (sortBy) {
          case "value-asc":
            return a.value - b.value || a.name.localeCompare(b.name);
          case "value-desc":
            return b.value - a.value || a.name.localeCompare(b.name);
          case "name-az":
            return a.name.localeCompare(b.name);
          case "name-za":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [state.hoverboardData, search, sortBy]);

  const itemValues = useMemo(() => {
    return Object.entries(state.bagData)
      .filter(([name]) => !/egg/i.test(name) && !/box/i.test(name))
      .map(([name, info]) => {
        const { tier, value } = classifyItem(name);
        return { name, info, value, tier };
      })
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        switch (sortBy) {
          case "value-asc":
            return a.value - b.value || a.name.localeCompare(b.name);
          case "value-desc":
            return b.value - a.value || a.name.localeCompare(b.name);
          case "name-az":
            return a.name.localeCompare(b.name);
          case "name-za":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [state.bagData, search, sortBy]);

  const eggValues = useMemo(() => {
    return Object.entries(state.bagData)
      .filter(([name]) => /egg/i.test(name))
      .map(([name, info]) => {
        const { tier, value } = classifyItem(name);
        return { name, info, value, tier };
      })
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        switch (sortBy) {
          case "value-asc":
            return a.value - b.value || a.name.localeCompare(b.name);
          case "value-desc":
            return b.value - a.value || a.name.localeCompare(b.name);
          case "name-az":
            return a.name.localeCompare(b.name);
          case "name-za":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [state.bagData, search, sortBy]);

  const boxValues = useMemo(() => {
    return Object.entries(state.bagData)
      .filter(([name]) => /box/i.test(name))
      .map(([name, info]) => {
        const { tier, value } = classifyItem(name);
        return { name, info, value, tier };
      })
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        switch (sortBy) {
          case "value-asc":
            return a.value - b.value || a.name.localeCompare(b.name);
          case "value-desc":
            return b.value - a.value || a.name.localeCompare(b.name);
          case "name-az":
            return a.name.localeCompare(b.name);
          case "name-za":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [state.bagData, search, sortBy]);

  const handleMethodChange = (next: ValueMethod) => {
    setMethod(next);
    state.setValueMethod(next);
    try {
      localStorage.setItem("cab_value_method", next);
    } catch {
      /* ignore */
    }
  };

  const counts = useMemo(() => ({
    rots: rotValues.length,
    hoverboards: hoverboardValues.length,
    items: itemValues.length,
    eggs: eggValues.length,
    boxes: boxValues.length,
  }), [rotValues.length, hoverboardValues.length, itemValues.length, eggValues.length, boxValues.length]);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          VALUES
        </h2>
        <p className="text-outline text-[10px] uppercase tracking-[0.3em] text-white/70">
          Brainrot values and item prices
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search values..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          label="SORT"
          options={[
            { value: "value-desc", label: "Value ↓" },
            { value: "value-asc", label: "Value ↑" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
        {tab === "rots" && (
          <SortPill
            value={method}
            onChange={(next) => handleMethodChange(next)}
            label="METHOD"
            options={[
              { value: "dev", label: "Dev" },
              { value: "rot", label: "Rot" },
            ]}
          />
        )}
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap justify-center gap-2">
        {([
          { id: "rots", icon: "book-open", label: `ROTS (${counts.rots})` },
          { id: "hoverboards", icon: "chart", label: `HOVERBOARDS (${counts.hoverboards})` },
          { id: "items", icon: "fire", label: `ITEMS (${counts.items})` },
          { id: "eggs", icon: "egg", label: `EGGS (${counts.eggs})` },
          { id: "boxes", icon: "box", label: `BOXES (${counts.boxes})` },
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
                background: isActive ? "rgba(124,179,255,0.6)" : undefined,
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
        {tab === "rots" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rotValues.length === 0 ? (
              <EmptyState text="No rots match your search" />
            ) : (
              rotValues.map(({ name, sp, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: tier.color,
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "overlay",
                    border: `2px solid ${tier.color}`,
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={sp.Icon ? iconUrl(sp.Icon) : ""}
                      alt={sp.FullName}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-white"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {sp.FullName}
                    </div>
                    <div
                      className="truncate text-[10px] text-white/80"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier.label} · R{sp.Rarity.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DemandIcon demand={sp.Demand} />
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : tab === "hoverboards" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hoverboardValues.length === 0 ? (
              <EmptyState text="No hoverboards match your search" />
            ) : (
              hoverboardValues.map(({ name, info, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: "2px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={info.Icon ? iconUrl(info.Icon) : ""}
                      alt={name}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {name}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier} · Speed {info.Speed.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DemandIcon demand={info.Demand} />
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : tab === "items" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {itemValues.length === 0 ? (
              <EmptyState text="No items match your search" />
            ) : (
              itemValues.map(({ name, info, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: "2px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={info.Icon ? iconUrl(info.Icon) : ""}
                      alt={name}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {name}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DemandIcon demand={info.Demand} />
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : tab === "eggs" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {eggValues.length === 0 ? (
              <EmptyState text="No eggs match your search" />
            ) : (
              eggValues.map(({ name, info, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: "2px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={info.Icon ? iconUrl(info.Icon) : ""}
                      alt={name}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {name}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DemandIcon demand={info.Demand} />
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {boxValues.length === 0 ? (
              <EmptyState text="No boxes match your search" />
            ) : (
              boxValues.map(({ name, info, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: "2px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={info.Icon ? iconUrl(info.Icon) : ""}
                      alt={name}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {name}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DemandIcon demand={info.Demand} />
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
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
