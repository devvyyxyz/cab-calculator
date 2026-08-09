"use client";

import type { TradeVerdict } from "@/lib/trade-values";
import { PixelIcon } from "@/components/trade/PixelIcon";

export function FairnessBadge({ verdict }: { verdict: TradeVerdict }) {
  const youWin = verdict.winner === "them";
  const symbol = youWin ? "+" : verdict.winner === "you" ? "−" : "=";
  const color = youWin ? "#22c55e" : verdict.winner === "you" ? "#ef4444" : "#fbbf24";
  const borderColor = youWin ? "#14532d" : verdict.winner === "you" ? "#7f1d1d" : "#92400e";
  const textColor = verdict.winner === "fair" ? "#1f2937" : "#ffffff";

  return (
    <div style={{ pointerEvents: "auto" }}>
      <div
        className="relative grid h-14 w-14 place-items-center rounded-full sm:h-16 sm:w-16"
        style={{
          background: color,
          border: `4px solid ${borderColor}`,
          boxShadow: `0 4px 0 0 ${borderColor}`,
          fontFamily: "var(--font-pixel), monospace",
        }}
        title={
          verdict.winner === "fair"
            ? "Fair trade"
            : verdict.winner === "you"
            ? `You're ahead by ${Math.abs(verdict.diff).toFixed(1)} (${(verdict.percent * 100).toFixed(0)}%)`
            : `They're ahead by ${Math.abs(verdict.diff).toFixed(1)} (${(verdict.percent * 100).toFixed(0)}%)`
        }
      >
        <span
          className="text-2xl leading-none sm:text-3xl"
          style={{
            color: textColor,
            WebkitTextStroke:
              verdict.winner === "fair" ? "none" : `2px ${borderColor}`,
            paintOrder: "stroke fill",
          }}
        >
          {symbol}
        </span>
      </div>
    </div>
  );
}
