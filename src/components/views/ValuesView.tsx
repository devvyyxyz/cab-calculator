"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  SectionDivider,
  EmptyState,
} from "@/lib/trade-utils";
import { classifyItem } from "@/lib/trade-values";
import type { Species, BagItemInfo } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { rarityTier } from "@/lib/trade-utils";
import { iconUrl } from "@/lib/cab-client";

export function ValuesView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"rots" | "items">("rots");

  const rotValues = Object.entries(state.rotsData)
    .map(([name, sp]) => {
      const base = sp.Rarity * 10;
      const ivMult = 0.6 + 0.5 * 0.8;
      const value = base * ivMult * (sp.IsExclusive ? 1.5 : 1);
      return { name, sp, value, tier: rarityTier(sp.Rarity, sp.IsExclusive) };
    })
    .filter((r) =>
      `${r.name} ${r.sp.ShortenedName} ${r.sp.FullName}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.value - a.value);

  const itemValues = Object.entries(state.bagData)
    .map(([name, info]) => {
      const { tier, value } = classifyItem(name);
      return { name, info, value, tier };
    })
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          VALUES
        </h2>
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
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap justify-center gap-2">
        {([
          { id: "rots", icon: "book-open", label: `ROTS (${rotValues.length})` },
          { id: "items", icon: "fire", label: `ITEMS (${itemValues.length})` },
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
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: `2px solid ${tier.color}60`,
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
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {sp.FullName}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier.label} · R{sp.Rarity.toFixed(2)}
                    </div>
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
