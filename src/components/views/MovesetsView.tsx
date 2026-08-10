"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { SectionDivider, EmptyState } from "@/lib/trade-utils";
import { usePersistentState } from "@/components/trade/usePersistentState";

interface Moveset {
  name: string;
  energy: number;
  type: "damage" | "healing" | "utility";
  demonExclusive: boolean;
  ownerCount: number;
  owners: string[];
}

const CACHE_KEY = "cab_movesets_cache";

export function MovesetsView() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"energy-asc" | "energy-desc" | "name-az" | "name-za">("cab_sort_movesets", "energy-asc");
  const [movesets, setMovesets] = useState<Moveset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCache = () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Moveset[];
          if (Array.isArray(parsed)) {
            setMovesets(parsed);
          }
        }
      } catch {
        // ignore corrupt cache
      }
    };

    loadCache();

    (async () => {
      try {
        const res = await fetch("/api/cab/movesets", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load movesets");
        const payload = (await res.json()) as { movesets?: Moveset[] };
        if (cancelled) return;
        const data = payload.movesets ?? [];
        setMovesets(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        // keep cache if available, otherwise empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = movesets
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "energy-asc":
          return a.energy - b.energy || a.name.localeCompare(b.name);
        case "energy-desc":
          return b.energy - a.energy || a.name.localeCompare(b.name);
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const sections: { label: string; items: Moveset[] }[] = [];
  if (sortBy === "energy-asc" || sortBy === "energy-desc") {
    for (const move of filtered) {
      const label = `${move.energy} Energy`;
      let section = sections.find((s) => s.label === label);
      if (!section) {
        section = { label, items: [] };
        sections.push(section);
      }
      section.items.push(move);
    }
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          MOVESETS
        </h2>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search movesets..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "energy-asc", label: "Energy ↑" },
            { value: "energy-desc", label: "Energy ↓" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded-xl bg-yellow-400/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="No movesets match your search" />
        ) : (() => {
          if (sortBy === "energy-asc" || sortBy === "energy-desc") {
            return sections.map((section) => (
              <div key={section.label} className="contents">
                <SectionDivider label={section.label} />
                {section.items.map((move) => (
                  <div
                    key={move.name}
                    className="flex items-center rounded-xl bg-yellow-400 px-4 py-2.5 shadow-sm"
                  >
                    <span className="truncate text-sm font-semibold uppercase tracking-wide text-yellow-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                      {move.name}
                    </span>
                  </div>
                ))}
              </div>
            ));
          }

          if (sortBy === "name-az" || sortBy === "name-za") {
            const sections: { label: string; items: Moveset[] }[] = [];
            for (const move of filtered) {
              const letter = (move.name[0] || "#").toUpperCase();
              const label = /[A-Z]/.test(letter) ? letter : "#";
              let section = sections.find((s) => s.label === label);
              if (!section) {
                section = { label, items: [] };
                sections.push(section);
              }
              section.items.push(move);
            }
            return sections.map((section) => (
              <div key={section.label} className="contents">
                <SectionDivider label={section.label} />
                {section.items.map((move) => (
                  <div
                    key={move.name}
                    className="flex items-center rounded-xl bg-yellow-400 px-4 py-2.5 shadow-sm"
                  >
                    <span className="truncate text-sm font-semibold uppercase tracking-wide text-yellow-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                      {move.name}
                    </span>
                  </div>
                ))}
              </div>
            ));
          }

          return filtered.map((move) => (
            <div
              key={move.name}
              className="flex items-center rounded-xl bg-yellow-400 px-4 py-2.5 shadow-sm"
            >
              <span className="truncate text-sm font-semibold uppercase tracking-wide text-yellow-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                {move.name}
              </span>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
