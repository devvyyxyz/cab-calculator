"use client";

import Image from "next/image";
import { PixelIcon } from "./PixelIcon";
import { useState } from "react";
import { toast } from "sonner";

export type NavView =
  | "trade"
  | "inventory"
  | "rots"
  | "skins"
  | "values"
  | "about";

interface NavItem {
  id: NavView;
  label: string;
  icon: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "trade", label: "Trade", icon: "repeat", color: "#7cb3ff" },
  { id: "inventory", label: "Inventory", icon: "backpack", color: "#7ed957" },
  { id: "rots", label: "Brainrots", icon: "book-open", color: "#fbbf24" },
  { id: "skins", label: "Hoverboards", icon: "fire", color: "#c084fc" },
  { id: "values", label: "Values", icon: "scale", color: "#f472b6" },
  { id: "about", label: "About", icon: "info-box", color: "#94a3b8" },
];

export function SideNav({
  active,
  onNavigate,
}: {
  active: NavView;
  onNavigate?: (view: NavView) => void;
}) {
  const [hovered, setHovered] = useState<NavView | null>(null);

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center gap-2 border-r-4 border-black/50 py-3 sm:w-20"
      style={{
        backgroundColor: "#0a1230",
        backgroundImage: "url('/stud_texture.png')",
        backgroundSize: "50px 50px",
        backgroundRepeat: "repeat",
        boxShadow:
          "4px 0 0 rgba(0,0,0,0.3), inset 0 0 60px 0 rgba(8,12,30,0.55)",
      }}
      aria-label="Main navigation"
    >
      {/* Semi-transparent dark overlay layer for extra contrast on top of studs */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,19,32,0.35) 0%, rgba(15,19,32,0.55) 100%)",
        }}
      />

      {/* Logo — raw icon, no background box */}
      <a
        href="/"
        className="group relative z-10 mb-2 block"
        aria-label="CAB Trade Calc home"
      >
        <Image
          src="/cab_icon.png"
          alt="Catch a Brainrot"
          width={44}
          height={44}
          priority
          className="h-11 w-11 rounded-lg object-cover [image-rendering:pixelated] transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
        />
      </a>

      {/* Divider */}
      <div className="relative z-10 my-1 h-0.5 w-8 rounded-full bg-white/15" />

      {/* Nav items */}
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const isHovered = hovered === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id !== "trade") {
                  toast.info(`${item.label} view — coming soon!`);
                }
                onNavigate?.(item.id);
              }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative flex h-11 w-11 items-center justify-center rounded-lg transition-all sm:h-12 sm:w-14"
              style={{
                background: isActive ? item.color : "rgba(255,255,255,0.06)",
                border: `2px solid ${
                  isActive ? item.color : "rgba(255,255,255,0.12)"
                }`,
                boxShadow: isActive
                  ? `0 3px 0 rgba(0,0,0,0.5), 0 0 12px ${item.color}66`
                  : "none",
                color: isActive ? "#0f1320" : "#e2e8f0",
              }}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <PixelIcon name={item.icon} size={24} color="currentColor" />
              {/* Tooltip */}
              <span
                className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                style={{
                  background: "#0f1320",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-pixel), monospace",
                  zIndex: 50,
                }}
              >
                {item.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                  style={{
                    background: "#fff",
                    boxShadow: "0 0 6px #fff",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
