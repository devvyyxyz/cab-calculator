"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import type { Species, RotsResponse } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";

export function SkillsView() {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"name-az" | "name-za" | "rarity" | "power">("cab_sort_skills", "power");
  const [skills, setSkills] = useState<Array<{ name: string; species: Species }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cab/rots", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load skill data");
        const payload = (await res.json()) as RotsResponse;
        if (cancelled) return;
        const entries = Object.entries(payload.Data || {}).map(([name, species]) => ({ name, species }));
        setSkills(entries);
      } catch {
        setSkills([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = skills
    .filter(({ name, species }) => {
      const haystack = `${name} ${species.FullName} ${species.ShortenedName}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aSpecies = a.species;
      const bSpecies = b.species;
      switch (sortBy) {
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        case "rarity":
          return bSpecies.Rarity - aSpecies.Rarity || a.name.localeCompare(b.name);
        case "power":
          return (bSpecies.Attack + bSpecies.Health + bSpecies.Speed) - (aSpecies.Attack + aSpecies.Health + aSpecies.Speed) || a.name.localeCompare(b.name);
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
          SKILLS
        </h2>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search skills..."
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
            { value: "power", label: "Power" },
            { value: "rarity", label: "Rarity" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-6 text-center text-sm text-slate-700" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
              No skills match your search.
            </div>
          ) : (
            filtered.map(({ name, species }) => {
              const totalPower = species.Attack + species.Health + species.Speed;
              return (
                <div
                  key={name}
                  className="rounded-[1.25rem] border border-black/20 bg-[#f8f6ef] p-3 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/80 p-1 sm:h-13 sm:w-13">
                      <SmartImage
                        src={species.Icon ? `/api/cab/icon?name=${encodeURIComponent(species.Icon)}` : ""}
                        alt={species.FullName}
                        imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                        fallbackSize={24}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
                          {species.FullName}
                        </h3>
                        {species.IsExclusive ? (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-red-300">
                            Exclusive
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                        {species.ShortenedName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    <div className="rounded-xl bg-white/5 p-2">
                      <div className="text-[11px] text-white">{species.Attack.toFixed(1)}</div>
                      Attack
                    </div>
                    <div className="rounded-xl bg-white/5 p-2">
                      <div className="text-[11px] text-white">{species.Health.toFixed(1)}</div>
                      Health
                    </div>
                    <div className="rounded-xl bg-white/5 p-2">
                      <div className="text-[11px] text-white">{species.Speed.toFixed(1)}</div>
                      Speed
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-400">
                    <span>Rarity {species.Rarity.toFixed(1)}</span>
                    <span>Power {totalPower.toFixed(1)}</span>
                  </div>
                </div>
              );
            })
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
