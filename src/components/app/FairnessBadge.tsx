"use client";

import type { TradeVerdict } from "@/lib/trade-values";
import { PixelIcon } from "@/components/trade/PixelIcon";

export function FairnessBadge({ verdict }: { verdict: TradeVerdict }) {
  const isWin = verdict.winner === "them";
  const isLoss = verdict.winner === "you";

  const background = isWin
    ? "linear-gradient(180deg, #22c55e, #15803d)"
    : isLoss
    ? "linear-gradient(180deg, #ef4444, #b91c1c)"
    : "linear-gradient(180deg, #fbbf24, #b45309)";

  const borderColor = isWin ? "#14532d" : isLoss ? "#7f1d1d" : "#92400e";
  const icon = isWin ? "check" : isLoss ? "close" : "info-box";
  const label = isWin ? "WIN" : isLoss ? "LOSS" : "FAIR";

  return (
    <button
      type="button"
      className="btn-follow flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-white enabled:active:translate-y-0.5"
      style={{
        fontFamily: "var(--font-pixel), monospace",
        background,
        border: "3px solid #0b0f1a",
        boxShadow: "0 3px 0 0 #0b0f1a",
      }}
      title={
        verdict.winner === "fair"
          ? "Fair trade"
          : verdict.winner === "you"
          ? `You're ahead by ${Math.abs(verdict.diff).toFixed(1)} (${(verdict.percent * 100).toFixed(0)}%)`
          : `They're ahead by ${Math.abs(verdict.diff).toFixed(1)} (${(verdict.percent * 100).toFixed(0)}%)`
      }
    >
      <PixelIcon name={icon} size={16} color="#ffffff" outline="#0b0f1a" outlineWidth={1} />
      {label}
    </button>
  );
}
