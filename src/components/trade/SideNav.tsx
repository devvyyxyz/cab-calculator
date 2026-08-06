"use client";

import Image from "next/image";
import { PixelIcon } from "./PixelIcon";
import { useState } from "react";

export type NavView =
  | "trade"
  | "inventory"
  | "rots"
  | "skins"
  | "values"
  | "settings"
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
  { id: "skins", label: "Items", icon: "fire", color: "#c084fc" },
  { id: "values", label: "Values", icon: "scale", color: "#f472b6" },
  { id: "settings", label: "Settings", icon: "switch", color: "#60a5fa" },
  { id: "about", label: "About", icon: "info-box", color: "#94a3b8" },
];

export function SideNav({
  active,
  onNavigate,
  profile,
}: {
  active: NavView;
  onNavigate?: (view: NavView) => void;
  profile?: { id: string; displayName: string; avatarUrl?: string } | null;
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
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-3">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              /* No container box — just the icon with an outline */
              className="group relative flex h-11 w-11 items-center justify-center transition-transform hover:scale-110 sm:h-12 sm:w-14"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <PixelIcon
                name={item.icon}
                size={28}
                color={isActive ? item.color : "#e2e8f0"}
                outline={isActive ? "#000000" : "rgba(0,0,0,0.7)"}
                outlineWidth={2}
              />
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
            </button>
          );
        })}
      </nav>

      {/* Profile avatar — bottom of sidebar */}
      {profile?.avatarUrl && (
        <div
          className="group relative z-10 mb-1"
          title={`${profile.displayName} · ID ${profile.id}`}
        >
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="h-11 w-11 rounded-lg object-cover [image-rendering:pixelated] sm:h-14 sm:w-14"
          />
          {/* Tooltip on hover — appears to the side like nav buttons */}
          <span
            className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block"
            style={{
              background: "#0f1320",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "var(--font-pixel), monospace",
              zIndex: 50,
            }}
          >
            {profile.displayName}
          </span>
        </div>
      )}
    </aside>
  );
}
