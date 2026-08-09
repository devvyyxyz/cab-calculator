"use client";

import type { BagItemInfo } from "@/lib/cab-types";
import { SmartImage } from "@/components/trade/SmartImage";
import { iconUrl } from "@/lib/cab-client";

export function InventoryBagSlot({
  name,
  qty,
  info,
  onClick,
}: {
  name: string;
  qty: number;
  info?: BagItemInfo;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square cursor-pointer"
      style={{
        background: "#374151",
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
      }}
      title={`${name} ×${qty}`}
    >
      <SmartImage
        src={info?.Icon ? iconUrl(info.Icon) : ""}
        alt={name}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      {qty > 1 && (
        <span
          className="text-outline-sm absolute bottom-0.5 right-0.5 text-xs text-white"
          style={{
            fontFamily: "var(--font-pixel), monospace",
          }}
        >
          ×{qty}
        </span>
      )}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {name}
      </div>
    </button>
  );
}
