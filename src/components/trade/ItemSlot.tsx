"use client";

import type { BagItemInfo } from "@/lib/cab-types";
import { SmartImage } from "@/components/trade/SmartImage";
import { iconUrl } from "@/lib/cab-client";

export function ItemSlot({ name, info }: { name: string; info: BagItemInfo }) {
  return (
    <div
      className="group relative aspect-square cursor-help"
      style={{
        background: "#374151",
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
      }}
      title={`${name} - ${info.Description}`}
    >
      <SmartImage
        src={iconUrl(info.Icon)}
        alt={name}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {name}
      </div>
    </div>
  );
}
