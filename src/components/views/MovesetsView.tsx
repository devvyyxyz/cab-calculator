"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  SectionDivider,
  EmptyState,
} from "@/lib/trade-utils";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";

interface Moveset {
  name: string;
  energy: number;
  type: "damage" | "healing" | "utility";
  demonExclusive: boolean;
  ownerCount: number;
  owners: string[];
}

const TYPE_ICON: Record<string, string> = {
  damage: "fire",
  healing: "heart",
  utility: "info-box",
};

const TYPE_COLOR: Record<string, string> = {
  damage: "#ef4444",
  healing: "#22c55e",
  utility: "#60a5fa",
};

export function MovesetsView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"energy-asc" | "energy-desc" | "name-az" | "name-za">("cab_sort_movesets", "energy-asc");
  const [movesets, setMovesets] = useState<Moveset[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cab/movesets", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load movesets");
        const payload = (await res.json()) as { movesets?: Moveset[] };
        if (cancelled) return;
        setMovesets(payload.movesets ?? []);
      } catch {
        setMovesets([]);
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

  const sections: { label: string; color: string; items: Moveset[] }[] = [];
  if (sortBy === "energy-asc" || sortBy === "energy-desc") {
    for (const move of filtered) {
      const label = `${move.energy} Energy`;
      let section = sections.find((s) => s.label === label);
      if (!section) {
        section = { label, color: move.demonExclusive ? "#64552b" : "#1e3a5f", items: [] };
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
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
          Each rot can have up to 4 movesets
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
        <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
          {filtered.length === 0 ? (
            <EmptyState text="No movesets match your search" />
          ) : (() => {
            if (sortBy === "energy-asc" || sortBy === "energy-desc") {
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} color={section.color} />
                  {section.items.map((move) => (
                    <div
                      key={move.name}
                      className="rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-3 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]"
                      style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/30">
                          <PixelIcon
                            name={TYPE_ICON[move.type] ?? "info-box"}
                            size={28}
                            color={TYPE_COLOR[move.type] ?? "#9ca3af"}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                              {move.name}
                            </h3>
                            {move.demonExclusive && (
                              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-red-300">
                                Demon Exclusive
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                            {move.ownerCount} {move.ownerCount === 1 ? "owner" : "owners"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        <div className="rounded-xl bg-white/5 p-2">
                          <div className="text-[11px] text-white">{move.energy} energy</div>
                          Energy Consumption
                        </div>
                        <div className="rounded-xl bg-white/5 p-2">
                          <div className="text-[11px] text-white capitalize">{move.type}</div>
                          Type
                        </div>
                      </div>
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
                      className="rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-3 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]"
                      style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/30">
                          <PixelIcon
                            name={TYPE_ICON[move.type] ?? "info-box"}
                            size={28}
                            color={TYPE_COLOR[move.type] ?? "#9ca3af"}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                              {move.name}
                            </h3>
                            {move.demonExclusive && (
                              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-red-300">
                                Demon Exclusive
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                            {move.energy} energy · {move.ownerCount} {move.ownerCount === 1 ? "owner" : "owners"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            }

            return filtered.map((move) => (
              <div
                key={move.name}
                className="rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-3 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]"
                style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/30">
                    <PixelIcon
                      name={TYPE_ICON[move.type] ?? "info-box"}
                      size={28}
                      color={TYPE_COLOR[move.type] ?? "#9ca3af"}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                        {move.name}
                      </h3>
                      {move.demonExclusive && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-red-300">
                          Demon Exclusive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                      {move.energy} energy · {move.ownerCount} {move.ownerCount === 1 ? "owner" : "owners"}
                    </p>
                  </div>
                </div>
              </div>
            ));
          })()}
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
