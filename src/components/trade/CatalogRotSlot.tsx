"use client";

import type { Species } from "@/lib/cab-types";
import { SmartImage } from "@/components/trade/SmartImage";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { rarityTier } from "@/lib/trade-utils";
import { iconUrl } from "@/lib/cab-client";

export function CatalogRotSlot({
  name,
  sp,
  onAdd,
  onTick,
  isTicking,
}: {
  name: string;
  sp: Species;
  onAdd?: (speciesName: string) => void;
  onTick?: (id: string) => void;
  isTicking?: boolean;
}) {
  const tier = rarityTier(sp.Rarity, sp.IsExclusive);
  return (
    <button
      type="button"
      onClick={() => { onAdd?.(name); onTick?.("catalog-" + name); }}
      className={`group relative aspect-square cursor-pointer ${tier.shimmer ? "shimmer-rare" : ""}`}
      style={{
        background: tier.color,
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
      }}
      title={sp.FullName}
    >
      <SmartImage
        src={sp.Icon ? iconUrl(sp.Icon) : ""}
        alt={sp.FullName}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {sp.ShortenedName}
      </div>
      {isTicking && (
        <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
          <PixelIcon name="check" size={32} color="#ffffff" />
        </span>
      )}
    </button>
  );
}
