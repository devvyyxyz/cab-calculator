"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { useAppState } from "@/components/app/AppStateProvider";

interface NewsItem {
  id: string;
  category: "news" | "updates" | "leaks";
  title: string;
  description: string;
  channel: string;
  date: string;
  icon?: string;
  gradient?: string;
  border?: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    category: "news",
    title: "Trading calculator, values list, inventory viewer & more",
    description:
      "Hey everyone, I have developed a server official catch a brainrot rotdex site. You can find the site here: https://cab.devvyy.xyz/",
    channel: "#announcements",
    date: "2025-01-15",
    icon: "📢",
    gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    border: "#1e3a5f",
  },
  {
    id: "2",
    category: "updates",
    title: "New Rotdex Features Released",
    description:
      "Added trade sharing, recent trades page, and damage calculator to the site.",
    channel: "#updates",
    date: "2025-02-01",
    icon: "🛠️",
    gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)",
    border: "#1e3a5f",
  },
  {
    id: "3",
    category: "leaks",
    title: "Upcoming Event Rot Leaked",
    description:
      "A new limited event rot has been datamined from the game files. Stay tuned for official reveal.",
    channel: "#leaks",
    date: "2025-02-10",
    icon: "🕵️",
    gradient: "linear-gradient(135deg, #f472b6, #ec4899)",
    border: "#1e3a5f",
  },
  {
    id: "4",
    category: "updates",
    title: "Values List Updated",
    description:
      "Updated trading values to be more accurate with in-game trades and demand.",
    channel: "#updates",
    date: "2025-02-15",
    icon: "📊",
    gradient: "linear-gradient(135deg, #34d399, #10b981)",
    border: "#1e3a5f",
  },
  {
    id: "5",
    category: "leaks",
    title: "New Moveset Teaser",
    description:
      "Unreleased moveset icons found in the latest game patch. Looks like a fire-type AOE move.",
    channel: "#leaks",
    date: "2025-02-20",
    icon: "🔥",
    gradient: "linear-gradient(135deg, #fb923c, #ea580c)",
    border: "#1e3a5f",
  },
];

export function NewsView() {
  const state = useAppState();

  const [tab, setTab] = useState<"news" | "updates" | "leaks">("news");
  const [search, setSearch] = useState("");

  const filtered = NEWS_ITEMS.filter((item) => {
    if (item.category !== tab) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.channel.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            NEWS & ANNOUNCEMENTS
          </h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search news..."
              className="stud-input h-9 max-w-md text-sm text-gray-900"
              style={{
                borderRadius: "0.875rem",
                fontFamily: "var(--font-pixel), monospace",
              }}
            />
          </div>

          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {([
              { id: "news", icon: "megaphone", label: `NEWS (${NEWS_ITEMS.filter((i) => i.category === "news").length})` },
              { id: "updates", icon: "repeat", label: `UPDATES (${NEWS_ITEMS.filter((i) => i.category === "updates").length})` },
              { id: "leaks", icon: "info-box", label: `LEAKS (${NEWS_ITEMS.filter((i) => i.category === "leaks").length})` },
            ] as const).map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="stud-input flex items-center gap-2 px-3 py-2 text-[10px] uppercase transition-all"
                  style={{
                    color: isActive ? "#1e3a5f" : "#374151",
                    fontFamily: "var(--font-pixel), monospace",
                    borderRadius: "0.875rem",
                    background: isActive
                      ? "rgba(124,179,255,0.6)"
                      : undefined,
                  }}
                >
                  <PixelIcon
                    name={t.icon}
                    size={16}
                    color={isActive ? "#1e3a5f" : "#6b7280"}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="col-span-full grid place-items-center py-10 text-center">
                <div className="text-3xl opacity-40">📦</div>
                <p className="mt-2 text-xs text-white/50">No items match your search</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-black/20 p-3 shadow-sm"
                  style={{
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: item.gradient || "linear-gradient(135deg, #fbbf24, #f59e0b)",
                        border: "3px solid #1e3a5f",
                        boxShadow: "0 3px 0 0 #1e3a5f",
                      }}
                    >
                      <span className="text-2xl">{item.icon || "📰"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-bold text-gray-900"
                        style={{ fontFamily: "var(--font-pixel), monospace" }}
                      >
                        {item.title.toUpperCase()}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                        <span>{item.channel}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{item.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
