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

function movesetTierColor(energy: number): string {
  if (energy <= 3) return "#4c644e";
  if (energy <= 6) return "#324b55";
  if (energy <= 9) return "#473155";
  return "#543233";
}

function MovesetCard({ move }: { move: Moveset }) {
  const color = movesetTierColor(move.energy);
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-black/20 p-3 shadow-sm"
      style={{
        background: color,
        backgroundImage: "url('/stud_texture.png')",
        backgroundSize: "30px 30px",
        backgroundRepeat: "repeat",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
        <span className="text-sm font-bold text-white">{move.energy}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold uppercase tracking-wide text-white">
          {move.name}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
          <span className="capitalize">{move.type}</span>
          <span>
            {move.ownerCount} owner{move.ownerCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

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
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
          View and manage your brainrot movesets
        </p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-black/20"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "overlay",
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState text="No movesets match your search" />
        ) : (() => {
          if (sortBy === "energy-asc" || sortBy === "energy-desc") {
            return sections.map((section) => (
              <div key={section.label}>
                <SectionDivider label={section.label} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {section.items.map((move) => (
                    <MovesetCard key={move.name} move={move} />
                  ))}
                </div>
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
              <div key={section.label}>
                <SectionDivider label={section.label} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {section.items.map((move) => (
                    <MovesetCard key={move.name} move={move} />
                  ))}
                </div>
              </div>
            ));
          }

          return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((move) => (
                <MovesetCard key={move.name} move={move} />
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
