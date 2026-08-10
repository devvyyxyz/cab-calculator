"use client";

import { cn } from "@/lib/utils";
import { useTilt } from "@/lib/useTilt";

/** Big retro pixel button matching the in-game trade UI. */
export function PixelButton({
  children,
  variant = "default",
  size = "md",
  className,
  ...rest
}: {
  children: React.ReactNode;
  variant?: "default" | "blue" | "green" | "red" | "amber" | "dark" | "olive";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const palette: Record<string, { bg: string; shadow: string; text: string }> = {
    default: { bg: "#e5e7eb", shadow: "#6b7280", text: "#1f2937" },
    blue: { bg: "#7cb3ff", shadow: "#1e3a5f", text: "#ffffff" },
    green: { bg: "#7ed957", shadow: "#2e5a1f", text: "#ffffff" },
    red: { bg: "#ef4444", shadow: "#7f1d1d", text: "#ffffff" },
    amber: { bg: "#fbbf24", shadow: "#92400e", text: "#1f2937" },
    dark: { bg: "#1f2937", shadow: "#000", text: "#ffffff" },
    olive: { bg: "#7a9b55", shadow: "#3a4a1f", text: "#ffffff" },
  };
  const p = palette[variant];
  const sizes = {
    sm: "px-2 py-1 text-[8px]",
    md: "px-3 py-2 text-[10px]",
    lg: "px-5 py-3 text-[12px]",
  };

  // Same 3D tilt effect as the landing "Get Started" button, scaled by button size.
  const maxTilt = size === "sm" ? 8 : size === "md" ? 12 : 14;
  const { ref, handleMouseMove, handleMouseEnter, handleMouseLeave, tilt, isHovering } =
    useTilt<HTMLButtonElement>(maxTilt, 4);

  return (
    <button
      {...rest}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "btn-follow relative font-bold uppercase tracking-wider",
        "active:translate-y-0.5",
        sizes[size],
        className
      )}
      style={{
        background: p.bg,
        color: p.text,
        borderRadius: "12px",
        boxShadow: isHovering
          ? `0 ${4 + tilt.translateY * 0.5}px 0 0 ${p.shadow}, inset 0 2px 0 0 rgba(255,255,255,0.4)`
          : `0 4px 0 0 ${p.shadow}, inset 0 2px 0 0 rgba(255,255,255,0.4)`,
        border: `2px solid ${p.shadow}`,
        fontFamily: "var(--font-pixel), monospace",
        textShadow:
          variant === "amber" || variant === "default"
            ? "none"
            : "1px 1px 0 rgba(0,0,0,0.5)",
        transform: isHovering
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translate(${tilt.translateX}px, ${tilt.translateY}px)`
          : "none",
        transition: isHovering
          ? "none"
          : "transform 0.3s ease-out, box-shadow 0.3s ease-out",
      }}
    >
      {children}
    </button>
  );
}
