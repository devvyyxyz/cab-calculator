"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";

interface Moveset {
  name: string;
  ownerCount: number;
  owners: string[];
}

export function MovesetsView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"name-az" | "name-za" | "owners-desc" | "owners-asc">("cab_sort_movesets", "name-az");
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
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        case "owners-desc":
          return b.ownerCount - a.ownerCount || a.name.localeCompare(b.name);
        case "owners-asc":
          return a.ownerCount - b.ownerCount || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

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
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
            { value: "owners-desc", label: "Owners ↓" },
            { value: "owners-asc", label: "Owners ↑" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-6 text-center text-sm text-slate-700" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
              No movesets match your search.
            </div>
          ) : (
            filtered.map((moveset) => (
              <div
                key={moveset.name}
                className="rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-3 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]"
                style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/30">
                    <PixelIcon
                      name="fire"
                      size={28}
                      color="#fbbf24"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                        {moveset.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                      {moveset.ownerCount} {moveset.ownerCount === 1 ? "owner" : "owners"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 p-2 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                  <span>Moveset</span>
                  <span className="text-white">{moveset.name}</span>
                </div>
              </div>
            ))
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
