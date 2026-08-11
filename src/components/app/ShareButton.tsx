"use client";

import { PixelIcon } from "@/components/trade/PixelIcon";

export function ShareButton({
  onClick,
  disabled,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-follow flex min-w-[6rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-white transition-all enabled:hover:scale-105 enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ""}`}
      style={{
        fontFamily: "var(--font-pixel), monospace",
        background: "linear-gradient(180deg, #3a4358, #1c2230)",
        border: "3px solid #0b0f1a",
        boxShadow: "0 3px 0 0 #0b0f1a",
      }}
      title={
        disabled ? "Add something to the trade first" : "Share this trade"
      }
    >
      <PixelIcon name="repeat" size={16} color="#7cb3ff" outline="#0b0f1a" outlineWidth={1} />
      SHARE
    </button>
  );
}
