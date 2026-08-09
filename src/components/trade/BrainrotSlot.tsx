"use client";

import type { Species } from "@/lib/cab-types";
import { SmartImage } from "@/components/trade/SmartImage";
import { rarityTier } from "@/lib/trade-utils";
import { iconUrl } from "@/lib/cab-client";

export function BrainrotSlot({ name, sp }: { name: string; sp: Species }) {
  const tier = rarityTier(sp.Rarity, sp.IsExclusive);
  return (
    <div
      className={`group relative aspect-square cursor-help ${tier.shimmer ? "shimmer-rare" : ""}`}
      style={{
        background: tier.color,
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
      }}
      title={`${sp.FullName} · Rarity ${sp.Rarity.toFixed(2)}${sp.IsExclusive ? " · DEMON" : ""}${sp.SpawnLocation ? ` · W${sp.SpawnLocation.World}Z${sp.SpawnLocation.Zone}` : ""}`}
    >
      <SmartImage
        src={iconUrl(sp.Icon)}
        alt={sp.FullName}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {sp.ShortenedName} · R{sp.Rarity.toFixed(1)}
      </div>
    </div>
  );
}
