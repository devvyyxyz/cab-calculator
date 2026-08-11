"use client";

import type { ValuedRot, ValuedItem } from "@/lib/trade-values";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";
import { ArrowBigDownDash, ArrowBigUpDash } from "pixelarticons/react";

export function TradePanel({
  title,
  variant,
  total,
  compareTotal,
  children,
}: {
  title: string;
  variant: "you" | "them";
  total: number;
  compareTotal?: number;
  children: React.ReactNode;
}) {
  const bg = variant === "you" ? "#7cb3ff" : "#7ed957";
  const border = variant === "you" ? "#1e3a5f" : "#2e5a1f";
  const isDown = compareTotal !== undefined && total < compareTotal;
  const ArrowIcon = isDown ? ArrowBigDownDash : ArrowBigUpDash;

  return (
    <div
      className="relative flex flex-col rounded-3xl p-3 sm:p-4"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      <div className="mb-4 flex items-center justify-between py-1">
        <h2
          className="text-left text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {title}
        </h2>
        <ArrowIcon
          width={20}
          height={20}
          className="shrink-0"
          style={{ color: "#ffffff" }}
        />
        <span
          className="text-right text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {total.toFixed(0)}
        </span>
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
    </div>
  );
}
