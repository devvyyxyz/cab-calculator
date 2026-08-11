"use client";

import Image from "next/image";
import { PixelIcon } from "./PixelIcon";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type NavView =
  | "trade"
  | "inventory"
  | "rots"
  | "skins"
  | "movesets"
  | "battle"
  | "team-builder"
  | "battle-simulator"
  | "damage-calculator"
  | "compare"
  | "values"
  | "news"
  | "settings"
  | "about";

const VIEW_TO_PATH: Record<NavView, string> = {
  trade: "/trade-calculator",
  inventory: "/inventory",
  rots: "/database/brainrots",
  skins: "/database/items",
  movesets: "/database/movesets",
  battle: "/battle",
  "team-builder": "/team-builder",
  "battle-simulator": "/battle-simulator",
  "damage-calculator": "/damage-calculator",
  compare: "/compare",
  values: "/values",
  news: "/news",
  settings: "/settings",
  about: "/about",
};

const PATH_TO_VIEW: Record<string, NavView> = {
  "/trade-calculator": "trade",
  "/inventory": "inventory",
  "/database/brainrots": "rots",
  "/database/items": "skins",
  "/database/movesets": "movesets",
  "/battle": "battle",
  "/team-builder": "team-builder",
  "/battle-simulator": "battle-simulator",
  "/damage-calculator": "damage-calculator",
  "/compare": "compare",
  "/values": "values",
  "/news": "news",
  "/settings": "settings",
  "/about": "about",
};

interface NavItem {
  id: NavView | "database" | "battle";
  label: string;
  icon: string;
  color: string;
  children?: Array<{ id: NavView; label: string; icon: string; color: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "trade", label: "Trade", icon: "repeat", color: "#7cb3ff" },
  { id: "inventory", label: "Inventory", icon: "backpack", color: "#7ed957" },
  { id: "database", label: "Database", icon: "book-open", color: "#fbbf24", children: [
    { id: "rots", label: "Brainrots", icon: "book-open", color: "#fbbf24" },
    { id: "skins", label: "Items", icon: "fire", color: "#c084fc" },
    { id: "movesets", label: "Movesets", icon: "scale", color: "#60a5fa" },
  ]},
  { id: "battle", label: "Battle", icon: "fire", color: "#fb923c", children: [
    { id: "team-builder", label: "Team Builder", icon: "backpack", color: "#7ed957" },
    { id: "battle-simulator", label: "Battle Simulator", icon: "repeat", color: "#fbbf24" },
    { id: "damage-calculator", label: "Damage Calculator", icon: "scale", color: "#60a5fa" },
    { id: "compare", label: "Compare", icon: "info-box", color: "#c084fc" },
  ]},
  { id: "values", label: "Values", icon: "scale", color: "#f472b6" },
  { id: "news", label: "News", icon: "book-open", color: "#f59e0b" },
  { id: "settings", label: "Settings", icon: "switch", color: "#60a5fa" },
  { id: "about", label: "About", icon: "info-box", color: "#94a3b8" },
];

export function SideNav({
  active: activeProp,
  onNavigate,
  profile,
  onProfileClick,
  expanded,
  onExpandedChange,
}: {
  active?: NavView;
  onNavigate?: (view: NavView) => void;
  profile?: { id: string; displayName: string; avatarUrl?: string } | null;
  onProfileClick?: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const view = PATH_TO_VIEW[pathname] ?? "trade";
  const isExpanded = expanded ?? false;
  const setIsExpanded = onExpandedChange ?? (() => {});

  const navigate = (target: NavView) => {
    const path = VIEW_TO_PATH[target];
    if (path) {
      router.push(path);
    }
    setIsExpanded(false);
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isChildActive = (item: NavItem) => {
    if (item.id === view) return true;
    return item.children?.some((child) => child.id === view) ?? false;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col gap-2 border-r-4 border-black/50 py-3 transition-all duration-200 ${isExpanded ? "w-44 sm:w-52" : "w-16 sm:w-20"} ${isExpanded ? "items-start" : "items-center"}`}
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
      <div className="flex flex-1 flex-col gap-3">
        {/* Logo */}
        <div className="flex justify-start px-2">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              setIsExpanded((prev) => !prev);
            }}
            className="group"
            aria-label="Toggle sidebar"
          >
            <Image
              src="/cab_icon.png"
              alt="Catch a Brainrot RotDex"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-lg object-cover [image-rendering:pixelated] transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
            />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isChildActive(item);
            const isOpen = openMenus[item.id];

            if (item.children) {
              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      toggleMenu(item.id);
                      if (!isExpanded) {
                        setIsExpanded(true);
                      }
                    }}
                    className={`group flex items-center justify-center transition-transform hover:scale-110 h-11 sm:h-12 ${
                      isExpanded ? "w-full justify-start gap-3 px-2" : "w-11 sm:w-14"
                    }`}
                    aria-label={item.label}
                    aria-expanded={isOpen}
                  >
                    <PixelIcon
                      name={item.icon}
                      size={28}
                      color={active ? item.color : "#e2e8f0"}
                      outline={active ? "#000000" : "rgba(0,0,0,0.7)"}
                      outlineWidth={2}
                    />
                    {isExpanded && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-100">{item.label}</span>
                    )}
                  </button>

                  {isExpanded && isOpen && (
                    <div className="ml-4 mt-1 flex flex-col gap-1">
                      {item.children.map((child) => {
                        const childActive = view === child.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => navigate(child.id)}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] uppercase tracking-wide transition-colors"
                          >
                            <PixelIcon
                              name={child.icon}
                              size={18}
                              color={childActive ? child.color : "#e2e8f0"}
                              outline={childActive ? "#000000" : "rgba(0,0,0,0.7)"}
                              outlineWidth={1.5}
                            />
                            <span className={childActive ? "text-white" : "text-slate-200"}>{child.label}</span>
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
                onClick={() => navigate(item.id)}
                className={`group flex items-center justify-center transition-transform hover:scale-110 h-11 sm:h-12 ${
                  isExpanded ? "w-full justify-start gap-3 px-2" : "w-11 sm:w-14"
                }`}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <PixelIcon
                  name={item.icon}
                  size={28}
                  color={active ? item.color : "#e2e8f0"}
                  outline={active ? "#000000" : "rgba(0,0,0,0.7)"}
                  outlineWidth={2}
                />
                {isExpanded && (
                  <span className="text-[10px] uppercase tracking-wide text-slate-100">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile avatar - bottom of sidebar */}
      {profile?.avatarUrl && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onProfileClick}
            className={`group flex ${isExpanded ? "w-full items-center justify-start gap-2 px-2" : "items-center justify-center"}`}
            title={`${profile.displayName} · ID ${profile.id} - Click to switch account`}
          >
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-11 w-11 flex-shrink-0 rounded-lg object-cover [image-rendering:pixelated] transition-transform hover:scale-110 sm:h-14 sm:w-14"
            />
            {isExpanded && (
              <span className="max-w-[8rem] truncate text-left text-[10px] uppercase tracking-wide text-slate-100">
                {profile.displayName}
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
