"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Rot, Species } from "@/lib/cab-types";
import { iconUrl } from "@/lib/cab-client";

/** A single squircle trade slot — empty or filled with a brainrot/item. */
export function TradeSlot({
  children,
  variant = "you",
  onClick,
  onRemove,
  empty,
}: {
  children?: React.ReactNode;
  variant?: "you" | "them";
  onClick?: () => void;
  onRemove?: () => void;
  empty?: boolean;
}) {
  const slotBg = variant === "you" ? "#cfe0ff" : "#d7f5c0";
  const slotShadow = variant === "you" ? "#3d5a99" : "#3a6b1f";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square w-full select-none transition-transform",
        "active:translate-y-0.5"
      )}
      style={{
        background: slotBg,
        borderRadius: "22%",
        boxShadow: `0 4px 0 0 ${slotShadow}, inset 0 2px 0 0 rgba(255,255,255,0.55)`,
        border: `3px solid ${slotShadow}`,
      }}
      aria-label={empty ? "Empty trade slot" : "Filled trade slot"}
    >
      {children}
      {!empty && onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove();
            }
          }}
          className="absolute -right-2 -top-2 z-10 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-red-500 text-xs font-bold text-white shadow-[0_2px_0_#7f1d1d] hover:bg-red-600"
          aria-label="Remove from offer"
        >
          ✕
        </span>
      )}
      <span className="sr-only">
        {variant === "you" ? "Your offer" : "Their offer"} slot
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[22%] ring-1 ring-inset ring-white/30" />
    </button>
  );
}

/** Renders a brainrot icon + level/iv badges inside a slot. */
export function RotSlotContent({
  rot,
  species,
  size = 64,
}: {
  rot: Rot;
  species?: Species;
  size?: number;
}) {
  const icon = species?.Icon ?? "1.png";
  const rarity = species?.Rarity ?? 0;
  const rarityColor =
    rarity >= 5
      ? "#ffd700"
      : rarity >= 4
      ? "#c084fc"
      : rarity >= 3
      ? "#3b82f6"
      : rarity >= 2
      ? "#22c55e"
      : "#9ca3af";

  return (
    <div className="relative flex h-full w-full items-center justify-center p-1.5">
      <Image
        src={iconUrl(icon)}
        alt={rot.Nickname || rot.Species}
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-contain [image-rendering:pixelated]"
      />
      {/* Level badge */}
      <span
        className="absolute bottom-0.5 left-0.5 rounded px-1 text-[8px] font-bold leading-tight text-white"
        style={{
          background: "#1f2937",
          boxShadow: "0 1px 0 #000",
          fontFamily: "var(--font-pixel), monospace",
        }}
      >
        L{rot.Level}
      </span>
      {/* Rarity / Exclusive */}
      {species?.IsExclusive && (
        <span
          className="absolute right-0.5 top-0.5 rounded px-1 text-[7px] font-bold leading-tight text-white"
          style={{ background: "#dc2626", fontFamily: "var(--font-pixel), monospace" }}
          title="Exclusive / Demon rot"
        >
          DEMON
        </span>
      )}
      {!species?.IsExclusive && rarity >= 4 && (
        <span
          className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full"
          style={{
            background: rarityColor,
            boxShadow: `0 0 0 2px #1f2937, 0 0 6px ${rarityColor}`,
          }}
          title={`Rarity ${rarity.toFixed(2)}`}
        />
      )}
    </div>
  );
}

/** Renders an item icon + quantity badge inside a slot. */
export function ItemSlotContent({
  icon,
  qty,
  size = 64,
  label,
}: {
  icon: string;
  qty: number;
  size?: number;
  label?: string;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-1.5">
      <Image
        src={iconUrl(icon)}
        alt={label ?? "item"}
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-contain [image-rendering:pixelated]"
      />
      {qty > 1 && (
        <span
          className="absolute bottom-0.5 right-0.5 rounded px-1 text-[8px] font-bold leading-tight text-white"
          style={{
            background: "#1f2937",
            boxShadow: "0 1px 0 #000",
            fontFamily: "var(--font-pixel), monospace",
          }}
        >
          ×{qty}
        </span>
      )}
    </div>
  );
}
