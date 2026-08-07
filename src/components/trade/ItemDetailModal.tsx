"use client";

import Image from "next/image";
import type { Rot, Species, BagItemInfo } from "@/lib/cab-types";
import { iconUrl } from "@/lib/cab-client";
import { SmartImage } from "./SmartImage";
import { PixelIcon } from "./PixelIcon";

/**
 * Item detail modal - shows when clicking a rot or item in the inventory.
 * Matches the in-game detail view layout: icon on right, stats + moves on left.
 */
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
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden"
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
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white shadow-[0_2px_0_#7f1d1d]"
          aria-label="Close"
        >
          <PixelIcon name="close" size={20} color="#ffffff" />
        </button>

        <div className="flex flex-col gap-3 p-5">
          {/* Header - name + subtitle */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className="text-outline truncate text-lg text-white sm:text-xl"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {name}
              </h3>
              <p
                className="text-outline-sm mt-1 text-[10px]"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  color: "#fcd34d",
                }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* Icon display - centered, fixed size */}
          <div className="grid h-28 place-items-center sm:h-32">
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

          {/* Divider */}
          <div className="h-1 rounded-full bg-white" />

          {/* Stats section - only for rots */}
          {isRot && (
            <div className="flex flex-col gap-3">
              {/* Rarity badge */}
              <div className="flex items-center justify-between">
                <span
                  className="text-outline-sm text-[9px] text-white"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  RARITY
                </span>
                <span
                  className="text-outline-sm rounded px-2 py-0.5 text-[9px] text-white"
                  style={{
                    fontFamily: "var(--font-pixel), monospace",
                    background:
                      species?.IsExclusive
                        ? "#7f1d1d"
                        : rarity >= 5
                        ? "#92400e"
                        : rarity >= 4
                        ? "#3f6212"
                        : rarity >= 3
                        ? "#374151"
                        : "#7f1d1d",
                  }}
                >
                  {rarityLabel} {rarity.toFixed(2)}
                </span>
              </div>

              {/* IV bar */}
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    IV
                  </span>
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {(rot!.IV * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-4 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${rot!.IV * 100}%`,
                      background: "linear-gradient(180deg, #a3e635, #65a30d)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                    }}
                  />
                </div>
              </div>

              {/* Health bar */}
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    HEALTH
                  </span>
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {currentHealth}/{maxHealth}
                  </span>
                </div>
                <div className="mt-1 h-4 overflow-hidden rounded-full bg-black/40">
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
                <div className="flex items-center justify-between">
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    EXP
                  </span>
                  <span
                    className="text-outline-sm text-[9px] text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {currentExp}/{(maxExp / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="mt-1 h-4 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((currentExp / maxExp) * 100, 100)}%`,
                      background: "linear-gradient(180deg, #fb923c, #c2410c)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>
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
                return (
                  <div
                    key={i}
                    className="grid place-items-center rounded-xl px-2 py-2"
                    style={{
                      background: color,
                      border: "2px solid rgba(0,0,0,0.2)",
                      boxShadow:
                        "inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.2)",
                    }}
                  >
                    <span
                      className="text-outline-sm text-[10px] text-white"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {move.toUpperCase()}
                    </span>
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
            className="w-full rounded-xl px-4 py-3 transition-transform active:translate-y-0.5"
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
      </div>
    </div>
  );
}
