"use client";

import type { Rot, Species } from "@/lib/cab-types";
import { SmartImage } from "@/components/trade/SmartImage";
import { rarityTier } from "@/lib/trade-utils";
import { iconUrl } from "@/lib/cab-client";

export function InventoryRotSlot({
  rot,
  sp,
  onClick,
}: {
  rot: Rot;
  sp?: Species;
  onClick?: () => void;
}) {
  const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-square cursor-pointer ${tier.shimmer ? "shimmer-rare" : ""}`}
      style={{
        background: tier.color,
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
      }}
      title={`${rot.Nickname || rot.Species}`}
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
    </button>
  );
}
