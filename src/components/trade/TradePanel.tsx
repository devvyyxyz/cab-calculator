"use client";

import { useState } from "react";
import type { ValuedRot, ValuedItem } from "@/lib/trade-values";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";

export function TradePanel({
  title,
  variant,
  total,
  valuedRots,
  items,
  children,
}: {
  title: string;
  variant: "you" | "them";
  total: number;
  valuedRots: ValuedRot[];
  items: ValuedItem[];
  children: React.ReactNode;
}) {
  const bg = variant === "you" ? "#7cb3ff" : "#7ed957";
  const border = variant === "you" ? "#1e3a5f" : "#2e5a1f";
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col rounded-3xl p-3 sm:p-4"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      <div className="mb-4 flex items-center justify-center py-1">
        <h2
          className="text-center text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {title} ({total.toFixed(0)})
        </h2>
      </div>

      <div
        className="grid grid-cols-4 gap-2 rounded-xl p-2 sm:gap-3 sm:p-3"
        style={{
          background: variant === "you" ? "#1e3a5f" : "#2e5a1f",
          boxShadow:
            "inset 0 2px 4px 0 rgba(0,0,0,0.45), inset 0 -1px 2px 0 rgba(255,255,255,0.1)",
        }}
      >
        {children}
      </div>

      {(valuedRots.length > 0 || items.length > 0) && (
        <div className="mt-3">
          <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-[10px] uppercase text-white"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            <span>DETAILS</span>
            <span
              style={{
                transform: detailsOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
                display: "inline-block",
              }}
            >
              ▼
            </span>
          </button>
          {detailsOpen && (
            <div className="mt-1 max-h-44 overflow-y-auto rounded-xl bg-black/25 p-2 text-[10px] text-white/90">
              {valuedRots.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 border-b border-white/10 py-1"
                >
                  <span className="truncate">
                    {r.rot.Nickname || r.rot.Species}
                    <span className="ml-1 text-white/60">
                      L{r.rot.Level} · IV {(r.rot.IV * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span className="font-bold">{r.value.toFixed(1)}</span>
                </div>
              ))}
              {items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 border-b border-white/10 py-1"
                >
                  <span className="truncate">
                    {it.name}
                    <span className="ml-1 text-white/60">×{it.qty} ({it.tier})</span>
                  </span>
                  <span className="font-bold">{it.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
