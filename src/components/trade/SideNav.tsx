"use client";

import Image from "next/image";
import { PixelIcon } from "./PixelIcon";
import { useState } from "react";

export type NavView =
  | "trade"
  | "inventory"
  | "rots"
  | "skins"
  | "skills"
  | "battle"
  | "team-builder"
  | "battle-simulator"
  | "damage-calculator"
  | "compare"
  | "values"
  | "news"
  | "settings"
  | "about";

interface NavItem {
  id: NavView | "database";
  label: string;
  icon: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "trade", label: "Trade", icon: "repeat", color: "#7cb3ff" },
  { id: "inventory", label: "Inventory", icon: "backpack", color: "#7ed957" },
  { id: "database", label: "Database", icon: "book-open", color: "#fbbf24" },
  { id: "battle", label: "Battle", icon: "fire", color: "#fb923c" },
  { id: "values", label: "Values", icon: "scale", color: "#f472b6" },
  { id: "news", label: "News", icon: "book-open", color: "#f59e0b" },
  { id: "settings", label: "Settings", icon: "switch", color: "#60a5fa" },
  { id: "about", label: "About", icon: "info-box", color: "#94a3b8" },
];

const DATABASE_ITEMS: Array<{ id: Extract<NavView, "rots" | "skins" | "skills">; label: string; icon: string; color: string }> = [
  { id: "rots", label: "Brainrots", icon: "book-open", color: "#fbbf24" },
  { id: "skins", label: "Items", icon: "fire", color: "#c084fc" },
  { id: "skills", label: "Skill", icon: "scale", color: "#60a5fa" },
];

const BATTLE_ITEMS: Array<{ id: Extract<NavView, "team-builder" | "battle-simulator" | "damage-calculator" | "compare">; label: string; icon: string; color: string }> = [
  { id: "team-builder", label: "Team Builder", icon: "backpack", color: "#7ed957" },
  { id: "battle-simulator", label: "Battle Simulator", icon: "repeat", color: "#fbbf24" },
  { id: "damage-calculator", label: "Damage Calculator", icon: "scale", color: "#60a5fa" },
  { id: "compare", label: "Compare", icon: "info-box", color: "#c084fc" },
];

export function SideNav({
  active,
  onNavigate,
  profile,
  onProfileClick,
}: {
  active: NavView;
  onNavigate?: (view: NavView) => void;
  profile?: { id: string; displayName: string; avatarUrl?: string } | null;
  onProfileClick?: () => void;
}) {
  const [hovered, setHovered] = useState<NavView | "database" | "battle" | null>(null);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col gap-2 border-r-4 border-black/50 py-3 transition-all duration-200 ${expanded ? "w-44 sm:w-52" : "w-16 sm:w-20"} ${expanded ? "items-start" : "items-center"}`}
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

      {/* Logo - raw icon, no background box */}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          setExpanded((prev) => !prev);
          setDatabaseOpen(false);
        }}
        className="group relative z-10 mb-2 block"
        aria-label="Toggle sidebar"
      >
        <Image
          src="/cab_icon.png"
          alt="Catch a Brainrot"
          width={44}
          height={44}
          priority
          className="h-11 w-11 rounded-lg object-cover [image-rendering:pixelated] transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
        />
      </button>

      {/* Divider */}
      <div className={`relative z-10 my-1 h-0.5 rounded-full bg-white/15 ${expanded ? "w-10" : "w-8"}`} />

      {/* Nav items */}
      <nav className={`relative z-10 flex flex-1 flex-col gap-3 ${expanded ? "w-full items-stretch px-2" : "items-center"}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const isDatabaseActive = active === "rots" || active === "skins" || active === "skills";
          const isBattleActive = active === "team-builder" || active === "battle-simulator" || active === "damage-calculator" || active === "compare";

          if (item.id === "database") {
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!expanded) {
                      setExpanded(true);
                    }
                    setDatabaseOpen(true);
                  }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group relative flex h-11 items-center justify-center transition-transform hover:scale-110 sm:h-12 ${expanded ? "w-full justify-start gap-3 rounded-lg px-2" : "w-11 sm:w-14"}`}
                  aria-label={item.label}
                  aria-current={isDatabaseActive ? "page" : undefined}
                >
                  <PixelIcon
                    name={item.icon}
                    size={28}
                    color={isDatabaseActive ? item.color : "#e2e8f0"}
                    outline={isDatabaseActive ? "#000000" : "rgba(0,0,0,0.7)"}
                    outlineWidth={2}
                  />
                  {!expanded && (
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
                  )}
                  {expanded && <span className="text-[10px] uppercase tracking-wide text-slate-100">{item.label}</span>}
                </button>

                {databaseOpen && (
                  <div
                    className="mt-1 flex w-full flex-col gap-1 rounded-xl border border-black/40 bg-[#0f1320]/95 p-1.5 shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
                    style={{
                      zIndex: 60,
                      fontFamily: "var(--font-pixel), monospace",
                    }}
                  >
                    {DATABASE_ITEMS.map((child) => {
                      const childActive = active === child.id;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            onNavigate?.(child.id);
                            setExpanded(false);
                            setDatabaseOpen(false);
                          }}
                          className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] uppercase tracking-wide transition-colors ${
                            childActive ? "bg-white/15 text-white" : "text-slate-200 hover:bg-white/10"
                          }`}
                        >
                          <PixelIcon
                            name={child.icon}
                            size={18}
                            color={childActive ? child.color : "#e2e8f0"}
                            outline={childActive ? "#000000" : "rgba(0,0,0,0.7)"}
                            outlineWidth={1.5}
                          />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (item.id === "battle") {
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!expanded) {
                      setExpanded(true);
                    }
                    setBattleOpen((prev) => !prev);
                  }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group relative flex h-11 items-center justify-center transition-transform hover:scale-110 sm:h-12 ${expanded ? "w-full justify-start gap-3 rounded-lg px-2" : "w-11 sm:w-14"}`}
                  aria-label={item.label}
                  aria-current={isBattleActive ? "page" : undefined}
                >
                  <PixelIcon
                    name={item.icon}
                    size={28}
                    color={isBattleActive ? item.color : "#e2e8f0"}
                    outline={isBattleActive ? "#000000" : "rgba(0,0,0,0.7)"}
                    outlineWidth={2}
                  />
                  {!expanded && (
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
                  )}
                  {expanded && <span className="text-[10px] uppercase tracking-wide text-slate-100">{item.label}</span>}
                </button>

                {battleOpen && (
                  <div
                    className="mt-1 flex w-full flex-col gap-1 rounded-xl border border-black/40 bg-[#0f1320]/95 p-1.5 shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
                    style={{
                      zIndex: 60,
                      fontFamily: "var(--font-pixel), monospace",
                    }}
                  >
                    {BATTLE_ITEMS.map((child) => {
                      const childActive = active === child.id;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            onNavigate?.(child.id);
                            setExpanded(false);
                            setBattleOpen(false);
                          }}
                          className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] uppercase tracking-wide transition-colors ${
                            childActive ? "bg-white/15 text-white" : "text-slate-200 hover:bg-white/10"
                          }`}
                        >
                          <PixelIcon
                            name={child.icon}
                            size={18}
                            color={childActive ? child.color : "#e2e8f0"}
                            outline={childActive ? "#000000" : "rgba(0,0,0,0.7)"}
                            outlineWidth={1.5}
                          />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate?.(item.id as NavView);
                setExpanded(false);
                setDatabaseOpen(false);
                setBattleOpen(false);
              }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              /* No container box - just the icon with an outline */
              className={`group relative flex h-11 items-center justify-center transition-transform hover:scale-110 sm:h-12 ${expanded ? "w-full justify-start gap-3 rounded-lg px-2" : "w-11 sm:w-14"}`}
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
              {!expanded && (
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
              )}
              {expanded && <span className="text-[10px] uppercase tracking-wide text-slate-100">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Profile avatar - bottom of sidebar */}
      {profile?.avatarUrl && (
        <button
          type="button"
          onClick={onProfileClick}
          className={`group relative z-10 mb-1 flex items-center ${expanded ? "w-full justify-start gap-2 rounded-lg px-2 py-1" : "justify-center"}`}
          title={`${profile.displayName} · ID ${profile.id} - Click to switch account`}
        >
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="h-11 w-11 rounded-lg object-cover [image-rendering:pixelated] transition-transform hover:scale-110 sm:h-14 sm:w-14"
          />
          {expanded ? (
            <span className="max-w-[8rem] truncate text-left text-[10px] uppercase tracking-wide text-slate-100">
              {profile.displayName}
            </span>
          ) : (
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
          )}
        </button>
      )}
    </aside>
  );
}
