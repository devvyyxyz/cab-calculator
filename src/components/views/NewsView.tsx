"use client";

import { useState, useEffect } from "react";
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

export function NewsView() {
  const state = useAppState();

  const [tab, setTab] = useState<"news" | "updates" | "leaks">("news");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to load news");
        const data = (await res.json()) as { posts: NewsItem[] };
        if (!cancelled) {
          setItems(data.posts ?? []);
        }
      } catch {
        // keep empty on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = items.filter((item) => {
    if (item.category !== tab) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.channel.toLowerCase().includes(q)
    );
  });

  const counts = {
    news: items.filter((i) => i.category === "news").length,
    updates: items.filter((i) => i.category === "updates").length,
    leaks: items.filter((i) => i.category === "leaks").length,
  };

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
          <p className="text-outline text-[10px] uppercase tracking-[0.3em] text-white/70">
            Latest updates, leaks, and announcements
          </p>
        </div>
      </div>

      <div className="shrink-0 px-4 sm:px-6">
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
              { id: "news", icon: "megaphone", label: `NEWS (${counts.news})` },
              { id: "updates", icon: "repeat", label: `UPDATES (${counts.updates})` },
              { id: "leaks", icon: "info-box", label: `LEAKS (${counts.leaks})` },
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
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-black/10"
                  style={{
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                  }}
                />
              ))}
            </div>
          ) : (
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
          )}
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
