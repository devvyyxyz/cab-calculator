"use client";

import Image from "next/image";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  rarityTier,
  SectionDivider,
  LegendChip,
  EmptyState,
} from "@/lib/trade-utils";
import { classifyItem } from "@/lib/trade-values";
import type { Species, BagItemInfo, PlayerData } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";

export function AboutView() {
  const state = useAppState();

  const totalSpecies = Object.keys(state.rotsData).length;
  const ownedSpecies = state.yourData
    ? new Set([...state.yourData.Team, ...state.yourData.PC].map((r) => r.Species)).size
    : 0;
  const totalRots = state.yourData ? state.yourData.Team.length + state.yourData.PC.length : 0;
  const bagTypes = state.yourData
    ? Object.values(state.yourData.Bag).filter((q) => q > 0).length
    : 0;
  const totalBagItems = state.yourData
    ? Object.values(state.yourData.Bag).reduce((s, q) => s + q, 0)
    : 0;

  const rarityDist = Object.values(state.rotsData).reduce(
    (acc, sp) => {
      const tier = rarityTier(sp.Rarity, sp.IsExclusive).label;
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const rarityEntries = Object.entries(rarityDist).sort((a, b) => b[1] - a[1]);
  const maxRarityCount = Math.max(...rarityEntries.map(([, c]) => c), 1);

  const ownedRarity = state.yourData
    ? [...state.yourData.Team, ...state.yourData.PC].reduce(
        (acc, rot) => {
          const sp = state.rotsData[rot.Species];
          if (sp) {
            const tier = rarityTier(sp.Rarity, sp.IsExclusive).label;
            acc[tier] = (acc[tier] ?? 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  const rarityColors: Record<string, string> = {
    Common: "#585858",
    Uncommon: "#4c644e",
    Rare: "#324b55",
    Epic: "#473155",
    Insane: "#543233",
    Exclusive: "#64552b",
  };

  const itemTypes = Object.entries(
    Object.keys(state.bagData).reduce(
      (acc, name) => {
        const tier = classifyItem(name).tier;
        acc[tier] = (acc[tier] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).sort((a, b) => b[1] - a[1]);
  const maxItemTypeCount = Math.max(...itemTypes.map(([, c]) => c), 1);

  const completionPct = totalSpecies > 0 ? (ownedSpecies / totalSpecies) * 100 : 0;

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <Image
            src="/cab_icon.png"
            alt="CAB: Rot Dex"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-2xl object-cover [image-rendering:pixelated]"
          />
          <h2
            className="text-outline text-center text-xl text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            ABOUT & STATS
          </h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            COLLECTION PROGRESS
          </h3>
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-outline-sm-white text-[10px] text-gray-700"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {ownedSpecies}/{totalSpecies} SPECIES
            </span>
            <span
              className="text-outline-sm-white text-[10px] font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {completionPct.toFixed(0)}%
            </span>
          </div>
          <div className="h-6 overflow-hidden rounded-lg bg-gray-200">
            <div
              className="grid h-full place-items-center rounded-lg"
              style={{
                width: `${Math.max(completionPct, 2)}%`,
                background: "linear-gradient(180deg, #4ade80, #16a34a)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                transition: "width 0.3s",
              }}
            >
              <span
                className="text-[8px] font-bold text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {completionPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            YOUR STATS
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { label: "Rots Owned", value: totalRots },
              { label: "Unique Species", value: ownedSpecies },
              { label: "Bag Types", value: bagTypes },
              { label: "Total Bag Items", value: totalBagItems },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b border-gray-200 py-2 last:border-0"
              >
                <span
                  className="text-xs text-gray-700"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {stat.label}
                </span>
                <span
                  className="text-outline-sm-white text-sm font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            RARITY DISTRIBUTION
          </h3>
          <div className="flex flex-col gap-2">
            {rarityEntries.map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2">
                <span
                  className="w-16 shrink-0 text-[8px] font-semibold text-gray-700"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {tier.toUpperCase()}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(count / maxRarityCount) * 100}%`,
                      background: rarityColors[tier] ?? "#6b7280",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
                <span
                  className="w-6 shrink-0 text-right text-[8px] font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {state.yourData && (
          <div
            className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
            style={{
              backgroundImage: "url('/stud_texture.png')",
              backgroundSize: "30px 30px",
              backgroundRepeat: "repeat",
              backgroundBlendMode: "multiply",
            }}
          >
            <h3
              className="text-outline-white mb-3 text-sm text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              OWNED BY RARITY
            </h3>
            <div className="flex flex-wrap gap-2">
              {rarityEntries.map(([tier, _]) => {
                const owned = ownedRarity[tier] ?? 0;
                const total = rarityDist[tier] ?? 0;
                const pct = total > 0 ? (owned / total) * 100 : 0;
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1.5"
                    style={{ border: `1px solid ${rarityColors[tier]}40` }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: rarityColors[tier] }}
                    />
                    <span
                      className="text-[8px] font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier.toUpperCase().slice(0, 4)}
                    </span>
                    <span
                      className="text-[8px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {owned}/{total}
                    </span>
                    <span
                      className="text-[8px] text-gray-500"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            ITEM TYPES
          </h3>
          <div className="flex flex-col gap-2">
            {itemTypes.map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2">
                <span
                  className="w-20 shrink-0 text-[8px] font-semibold text-gray-700"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {tier.toUpperCase()}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full rounded bg-blue-500"
                    style={{
                      width: `${(count / maxItemTypeCount) * 100}%`,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
                <span
                  className="w-6 shrink-0 text-right text-[8px] font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            GAME TOTALS
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center"
              style={{ border: "2px solid #3b82f6" }}
            >
              <div
                className="text-outline-white text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {totalSpecies}
              </div>
              <div
                className="mt-1 text-[8px] font-semibold text-gray-700"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                SPECIES
              </div>
            </div>
            <div
              className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center"
              style={{ border: "2px solid #a855f7" }}
            >
              <div
                className="text-outline-white text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {Object.keys(state.bagData).length}
              </div>
              <div
                className="mt-1 text-[8px] font-semibold text-gray-700"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                ITEMS
              </div>
            </div>
          </div>
        </div>

        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <a
            href="https://indieun.com/cab/rots"
            target="_blank"
            rel="noopener noreferrer"
            className="stud-input block rounded-cab-sm px-4 py-3 text-center text-[10px] font-bold uppercase text-gray-900 no-underline transition-all hover:bg-blue-50"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            📊 VIEW API DOCS
          </a>
        </div>

        <p
          className="text-center text-[8px] text-white/60"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          NOT AFFILIATED WITH ROBLOX
        </p>
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
