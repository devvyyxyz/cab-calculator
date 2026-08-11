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
];

const ACCOUNT_MENU_ITEMS = [
  { id: "settings", label: "Settings", icon: "switch", color: "#60a5fa" },
  { id: "about", label: "About", icon: "info-box", color: "#94a3b8" },
  { id: "logout", label: "Logout", icon: "close", color: "#ef4444" },
];

export function TopNav({
  profile,
  onLogout,
}: {
  profile?: { id: string; displayName: string; avatarUrl?: string } | null;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [accountOpen, setAccountOpen] = useState(false);
  const view = PATH_TO_VIEW[pathname] ?? "trade";

  const navigate = (target: NavView) => {
    const path = VIEW_TO_PATH[target];
    if (path) {
      router.push(path);
    }
    setOpenMenus({});
    setAccountOpen(false);
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isChildActive = (item: NavItem) => {
    if (item.id === view) return true;
    return item.children?.some((child) => child.id === view) ?? false;
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 border-b-4 border-black/50 px-4"
      style={{
        backgroundColor: "#0a1230",
        backgroundImage: "url('/stud_texture.png')",
        backgroundSize: "50px 50px",
        backgroundRepeat: "repeat",
        boxShadow:
          "0 4px 0 rgba(0,0,0,0.3), inset 0 0 60px 0 rgba(8,12,30,0.55)",
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

      {/* Logo - far left */}
      <div className="relative z-10 flex shrink-0 items-center">
        <a href="/trade-calculator" className="group">
          <Image
            src="/cab_icon.png"
            alt="Catch a Brainrot RotDex"
            width={44}
            height={44}
            priority
            className="h-10 w-10 rounded-lg object-cover [image-rendering:pixelated] transition-transform group-hover:scale-110"
          />
        </a>
      </div>

      {/* Vertical separator */}
      <div className="relative z-10 h-8 w-0.5 shrink-0 rounded-full bg-white/20" />

      {/* Navigation items */}
      <div className="relative z-10 flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isChildActive(item);
          const isOpen = openMenus[item.id];

          if (item.children) {
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleMenu(item.id)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] uppercase tracking-wide transition-colors"
                  style={{ color: active ? "#ffffff" : "#e2e8f0" }}
                  aria-label={item.label}
                  aria-expanded={isOpen}
                >
                  <PixelIcon
                    name={item.icon}
                    size={20}
                    color={active ? item.color : "#e2e8f0"}
                    outline={active ? "#000000" : "rgba(0,0,0,0.7)"}
                    outlineWidth={1.5}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>

                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 flex min-w-[160px] flex-col gap-1 rounded-xl border border-black/20 p-2 shadow-lg"
                    style={{
                      backgroundColor: "#0a1230",
                      backgroundImage: "url('/stud_texture.png')",
                      backgroundSize: "40px 40px",
                      backgroundRepeat: "repeat",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 z-0 rounded-xl"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(15,19,32,0.35) 0%, rgba(15,19,32,0.55) 100%)",
                      }}
                    />
                    {item.children.map((child) => {
                      const childActive = view === child.id;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => navigate(child.id)}
                          className="relative z-10 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] uppercase tracking-wide transition-colors"
                        >
                          <PixelIcon
                            name={child.icon}
                            size={18}
                            color={childActive ? child.color : "#e2e8f0"}
                            outline={childActive ? "#000000" : "rgba(0,0,0,0.7)"}
                            outlineWidth={1.5}
                          />
                          <span className={childActive ? "text-white" : "text-slate-200"}>
                            {child.label}
                          </span>
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
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] uppercase tracking-wide transition-colors"
              style={{ color: active ? "#ffffff" : "#e2e8f0" }}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <PixelIcon
                name={item.icon}
                size={20}
                color={active ? item.color : "#e2e8f0"}
                outline={active ? "#000000" : "rgba(0,0,0,0.7)"}
                outlineWidth={1.5}
              />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Account dropdown - triggered by avatar */}
      {profile?.avatarUrl && (
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => setAccountOpen((prev) => !prev)}
            className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-white/30 transition-transform hover:scale-110"
            title={`${profile.displayName} · ID ${profile.id}`}
            aria-expanded={accountOpen}
          >
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover [image-rendering:pixelated]"
            />
          </button>

          {accountOpen && (
            <div
              className="absolute right-0 top-full mt-1 flex min-w-[160px] flex-col gap-1 rounded-xl border border-black/20 p-2 shadow-lg"
              style={{
                backgroundColor: "#0a1230",
                backgroundImage: "url('/stud_texture.png')",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 z-0 rounded-xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(15,19,32,0.35) 0%, rgba(15,19,32,0.55) 100%)",
                }}
              />
              {ACCOUNT_MENU_ITEMS.map((item) => {
                const isActive = view === item.id;
                if (item.id === "logout") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        onLogout?.();
                      }}
                      className="relative z-10 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] uppercase tracking-wide transition-colors"
                    >
                      <PixelIcon
                        name={item.icon}
                        size={18}
                        color="#ef4444"
                        outline="#000000"
                        outlineWidth={1.5}
                      />
                      <span className="text-red-400">Logout</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className="relative z-10 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] uppercase tracking-wide transition-colors"
                  >
                    <PixelIcon
                      name={item.icon}
                      size={18}
                      color={isActive ? item.color : "#e2e8f0"}
                      outline={isActive ? "#000000" : "rgba(0,0,0,0.7)"}
                      outlineWidth={1.5}
                    />
                    <span className={isActive ? "text-white" : "text-slate-200"}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
