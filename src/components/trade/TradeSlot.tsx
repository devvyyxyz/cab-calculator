"use client";

import { cn } from "@/lib/utils";
import type { Rot, Species } from "@/lib/cab-types";
import { iconUrl } from "@/lib/cab-client";
import { SmartImage } from "./SmartImage";
import { PixelIcon } from "./PixelIcon";

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
      {/* Hover overlay with remove button — only shows on hover.
          Just darkness + large pixel icon, no red container. */}
      {!empty && onRemove && (
        <span
          className="absolute inset-0 z-20 flex items-center justify-center rounded-[18%] bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
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
            className="grid h-10 w-10 cursor-pointer place-items-center"
            aria-label="Remove from offer"
          >
            <PixelIcon name="close" size={32} color="#ffffff" />
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

/** Renders a brainrot icon inside a slot — no tags/badges, just the icon. */
export function RotSlotContent({
  rot,
  species,
}: {
  rot: Rot;
  species?: Species;
}) {
  const icon = species?.Icon ?? "";
  return (
    <div className="relative flex h-full w-full items-center justify-center p-1.5">
      <SmartImage
        src={icon ? iconUrl(icon) : ""}
        alt={rot.Nickname || rot.Species}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
    </div>
  );
}

/** Renders an item icon + quantity badge inside a slot. */
export function ItemSlotContent({
  icon,
  qty,
  label,
}: {
  icon: string;
  qty: number;
  label?: string;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-1.5">
      <SmartImage
        src={icon ? iconUrl(icon) : ""}
        alt={label ?? "item"}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      {qty > 1 && (
        <span
          className="absolute bottom-0.5 right-0.5 px-1 text-[8px] font-bold leading-tight text-white"
          style={{
            background: "#1f2937",
            fontFamily: "var(--font-pixel), monospace",
          }}
        >
          ×{qty}
        </span>
      )}
    </div>
  );
}
