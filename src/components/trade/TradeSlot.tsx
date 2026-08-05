"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Rot, Species } from "@/lib/cab-types";
import { iconUrl } from "@/lib/cab-client";

/** A single squircle trade slot — empty or filled with a brainrot/item.
 *  The shared dark background is provided by the parent panel grid; each slot
 *  is just the pale recessed "floor" surface where items sit. */
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
  // Inner light floor (pale blue-grey / pale green-grey)
  const innerBg = variant === "you" ? "#d4e0eb" : "#d8ecc8";
  const innerShadow = variant === "you" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.4)";
  const innerHighlight =
    variant === "you" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.6)";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-square w-full select-none transition-transform",
        "active:translate-y-0.5"
      )}
      style={{
        background: innerBg,
        borderRadius: "18%",
        // Recessed well: top highlight, bottom dark inset
        boxShadow: `inset 0 2px 2px 0 ${innerHighlight}, inset 0 -2px 3px 0 ${innerShadow}`,
      }}
      aria-label={empty ? "Empty trade slot" : "Filled trade slot"}
    >
      {/* Content sits above the floor */}
      <span className="relative z-10 block h-full w-full">
        {children}
      </span>
      {/* Hover overlay with remove button — only shows on hover */}
      {!empty && onRemove && (
        <span
          className="absolute inset-0 z-20 flex items-center justify-center rounded-[18%] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        >
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
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-red-500 text-xs font-bold text-white shadow-[0_2px_0_#7f1d1d] hover:bg-red-600"
            aria-label="Remove from offer"
          >
            ✕
          </span>
        </span>
      )}
      <span className="sr-only">
        {variant === "you" ? "Your offer" : "Their offer"} slot
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[18%] ring-1 ring-inset ring-white/30" />
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
