"use client";

import { useEffect, useState } from "react";
import type { Rot, Species, BagItemInfo } from "@/lib/cab-types";
import { iconUrl } from "@/lib/cab-client";
import { SmartImage } from "./SmartImage";
import { Zap } from "pixelarticons/react";
import { TiltCard } from "./TiltCard";
import { sellSpecies } from "@/lib/trade-values";

const MOVESET_CACHE_KEY = "cab_movesets_cache";

interface MovesetInfo {
  name: string;
  energy: number;
  type: "damage" | "healing" | "utility";
  demonExclusive: boolean;
  ownerCount: number;
  owners: string[];
}

export function ItemDetailModal({
  rot,
  species,
  bagItem,
  onClose,
  onAddToOffer,
  inOffer,
}: {
  rot?: Rot;
  species?: Species;
  bagItem?: { name: string; info: BagItemInfo; qty: number };
  onClose: () => void;
  onAddToOffer?: () => void;
  inOffer?: boolean;
}) {
  const [movesetData, setMovesetData] = useState<Record<string, MovesetInfo>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOVESET_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MovesetInfo[];
        if (Array.isArray(parsed)) {
          const map: Record<string, MovesetInfo> = {};
          for (const m of parsed) {
            map[m.name] = m;
          }
          setMovesetData(map);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);
  // Determine what we're showing
  const isRot = !!rot;
  const name = isRot
    ? rot!.Nickname || species?.FullName || "Unknown"
    : bagItem?.name ?? "Unknown";
  const subtitle = isRot
    ? `${species?.IsExclusive ? "EXCLUSIVE " : ""}LVL ${rot!.Level}`
    : bagItem?.info?.Description ?? "";
  const icon = isRot ? species?.Icon : bagItem?.info?.Icon;

  // Rot-specific stats
  const maxHealth = species ? Math.round(species.Health * 100) : 0;
  const currentHealth = maxHealth;
  const maxExp = rot ? Math.round(10 + rot.Level * 0.4) * 1000 : 0;
  const currentExp = 0;
  const moveset = rot?.Moveset ?? [];
  const rarity = species?.Rarity ?? 0;
  const rarityLabel = species?.IsExclusive
    ? "DEMON"
    : rarity >= 5
    ? "LEGENDARY"
    : rarity >= 4
    ? "EPIC"
    : rarity >= 3
    ? "RARE"
    : rarity >= 2
    ? "UNCOMMON"
    : "COMMON";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <TiltCard
        onClick={(e) => e.stopPropagation()}
        className="modal-pop relative w-full max-w-md overflow-hidden"
        style={{
          backgroundColor: "#3b82f6",
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "50px 50px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "soft-light",
          borderRadius: "1.5rem",
          border: "3px solid rgba(255,255,255,0.3)",
          boxShadow:
            "0 8px 0 rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)",
        }}
      >

        <div className="flex flex-col gap-2 p-4">
          {/* Top section: stats on left, icon on right */}
          {isRot ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              {/* Left side - stats */}
              <div className="flex flex-col gap-1.5 min-w-0">
                {/* Serial - only for rots */}
                {rot?.Serial && (
                  <div
                    className="text-left text-sm font-bold tracking-widest"
                    style={{
                      fontFamily: "var(--font-pixel), monospace",
                      color: "#fcd34d",
                      WebkitTextStroke: `1.5px rgba(180, 83, 9, 1)`,
                      textShadow:
                        "0 2px 0 rgba(180, 83, 9, 1), 0 -1px 0 rgba(180, 83, 9, 1), 1px 0 0 rgba(180, 83, 9, 1), -1px 0 0 rgba(180, 83, 9, 1)",
                      paintOrder: "stroke fill",
                    }}
                  >
                    #{rot.Serial}
                  </div>
                )}

                {/* Name */}
                <h3
                  className="text-outline text-lg text-white sm:text-xl"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {name}
                </h3>

                {/* Rarity + Level */}
                <p
                  className="text-outline-sm text-[10px]"
                  style={{
                    fontFamily: "var(--font-pixel), monospace",
                    color: "#fcd34d",
                  }}
                >
                  {rarityLabel} LVL {rot!.Level}
                </p>

                {/* Divider */}
                <div className="h-1 rounded-full bg-white" />

                {/* Health bar */}
                <div>
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    HEALTH
                  </span>
                  <div className="mt-0.5 h-5 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="grid h-full place-items-center rounded-full"
                      style={{
                        width: "100%",
                        background: "linear-gradient(180deg, #4ade80, #16a34a)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                      }}
                    >
                      <span
                        className="text-[8px] text-black"
                        style={{ fontFamily: "var(--font-pixel), monospace" }}
                      >
                        {currentHealth}/{maxHealth}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EXP bar */}
                <div>
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    EXP
                  </span>
                  <div className="mt-0.5 h-5 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="grid h-full place-items-center rounded-full"
                      style={{
                        width: "100%",
                        background: "linear-gradient(180deg, #fb923c, #c2410c)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                      }}
                    >
                      <span
                        className="text-[8px] text-black"
                        style={{ fontFamily: "var(--font-pixel), monospace" }}
                      >
                        {currentExp}/{(maxExp / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sell value */}
                {species && rot && (() => {
                  const sell = sellSpecies(species, rot.Level);
                  if (!sell) return null;
                  const coinIcon = species.SpawnLocation?.World === 2 ? iconUrl("108") : iconUrl("100");
                  return (
                    <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <SmartImage
                          src={coinIcon}
                          alt="coin"
                          fill={false}
                          fallbackSize={16}
                          imgClassName="h-4 w-4 object-contain [image-rendering:pixelated]"
                        />
                        <span
                          className="text-outline-sm text-[9px] text-white"
                          style={{ fontFamily: "var(--font-pixel), monospace" }}
                        >
                          EST. SELL VALUE
                        </span>
                      </div>
                      <span
                        className="text-outline-sm text-sm font-bold text-yellow-300"
                        style={{ fontFamily: "var(--font-pixel), monospace" }}
                      >
                        {sell.display}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Right side - icon */}
              <div className="grid h-28 w-28 shrink-0 place-items-center justify-self-center icon-idle-float sm:h-32 sm:w-32">
                {icon ? (
                  <SmartImage
                    src={iconUrl(icon)}
                    alt={name}
                    fill={false}
                    fallbackSize={96}
                    imgClassName="object-contain [image-rendering:pixelated]"
                  />
                ) : (
                  <Image
                    src="/cab_icon.png"
                    alt={name}
                    width={96}
                    height={96}
                    className="opacity-30 [image-rendering:pixelated]"
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Bag item header */}
              <h3
                className="text-outline truncate text-lg text-white sm:text-xl"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {name}
              </h3>
              <p className="text-[10px] text-white/80">{bagItem?.info?.Description}</p>
            </>
          )}

          {/* Bag item info - only for bag items */}
          {!isRot && bagItem && (
            <div className="flex flex-col gap-2">
              <p
                className="text-outline-sm text-[10px] text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                OWNED: {bagItem.qty}
              </p>
              <p className="text-[10px] text-white/80">{bagItem.info?.Description}</p>
            </div>
          )}

          {/* Divider */}
          <div className="h-1 rounded-full bg-white" />

          {/* Moveset - only for rots */}
          {isRot && moveset.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {moveset.slice(0, 4).map((move, i) => {
                const colors = ["#fbbf24", "#7dd3fc", "#ef4444", "#22d3ee"];
                const color = colors[i % colors.length];
                const moveInfo = movesetData[move];
                const energy = moveInfo?.energy ?? null;
                return (
                  <div
                    key={i}
                    className="grid place-items-center rounded-xl px-3 py-2"
                    style={{
                      background: color,
                      backgroundImage: "url('/stud_texture.png')",
                      backgroundSize: "20px 20px",
                      backgroundRepeat: "repeat",
                      backgroundBlendMode: "multiply",
                      border: "2px solid rgba(0,0,0,0.2)",
                      boxShadow:
                        "inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.2)",
                    }}
                  >
                     <div className="flex flex-col items-center gap-1">
                       <span
                         className="text-sm font-bold text-white"
                         style={{ fontFamily: "var(--font-pixel), monospace" }}
                       >
                         {move.toUpperCase()}
                       </span>
                       {energy !== null && (
                         <span className="flex items-center gap-1 text-xs text-white/90">
                           <Zap width={14} height={14} style={{ color: "#ffffff" }} />
                           {energy}
                         </span>
                       )}
                     </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add to offer button */}
          {onAddToOffer && (
            <button
              onClick={onAddToOffer}
              disabled={inOffer}
              className="mt-1 w-full rounded-xl px-4 py-3 transition-transform active:translate-y-0.5 disabled:opacity-40"
              style={{
                background: inOffer ? "#6b7280" : "#22c55e",
                border: "2px solid rgba(0,0,0,0.2)",
                boxShadow:
                  "inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.2), 0 3px 0 rgba(0,0,0,0.3)",
                fontFamily: "var(--font-pixel), monospace",
                color: "#ffffff",
              }}
            >
              {inOffer ? "IN OFFER" : "ADD TO OFFER"}
            </button>
          )}

          {/* Back button */}
          <button
            onClick={onClose}
            className="btn-follow w-full rounded-xl px-4 py-3 transition-transform active:translate-y-0.5"
            style={{
              background: "#9ca3af",
              border: "2px solid rgba(0,0,0,0.2)",
              boxShadow:
                "inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.2), 0 3px 0 rgba(0,0,0,0.3)",
              fontFamily: "var(--font-pixel), monospace",
              color: "#ffffff",
            }}
          >
            BACK
          </button>
        </div>
      </TiltCard>
    </div>
  );
}
