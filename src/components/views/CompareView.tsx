"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { SortPill } from "@/components/trade/SortPill";
import { SmartImage } from "@/components/trade/SmartImage";
import { iconUrl } from "@/lib/cab-client";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Tooltip,
} from "recharts";
import { TriangleTooltip } from "@/components/app/TriangleTooltip";
import { formatDelta, rarityTier, SectionDivider, EmptyState } from "@/lib/trade-utils";
import type { Species } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { usePersistentState } from "@/components/trade/usePersistentState";

export function CompareView({ embedded = false }: { embedded?: boolean }) {
  const state = useAppState();
  const [selected, setSelected] = useState<string[]>([]);
  const [weights, setWeights] = useState({ attack: 1.2, health: 1, speed: 1.1 });
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mattersOpen, setMattersOpen] = useState(true);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [selectorSortBy, setSelectorSortBy] = usePersistentState<"rarity-desc" | "rarity-asc" | "name-az" | "name-za">("cab_compare_sort", "rarity-desc");

  const selectedEntries = useMemo(() => {
    return selected
      .map((name) => {
        const species = state.rotsData[name];
        return species ? { name, species } : null;
      })
      .filter(Boolean) as Array<{ name: string; species: Species }>;
  }, [state.rotsData, selected]);

  const maxValues = useMemo(() => {
    if (selectedEntries.length === 0) return { attack: 1, health: 1, speed: 1, rarity: 1 };
    return selectedEntries.reduce(
      (acc, { species }) => ({
        attack: Math.max(acc.attack, species.Attack),
        health: Math.max(acc.health, species.Health),
        speed: Math.max(acc.speed, species.Speed),
        rarity: Math.max(acc.rarity, species.Rarity),
      }),
      { attack: 0, health: 0, speed: 0, rarity: 0 }
    );
  }, [selectedEntries]);

  const radarData = useMemo(() => {
    return [
      {
        stat: "Attack",
        ...Object.fromEntries(
          selectedEntries.map(({ name, species }) => [
            name,
            Number((species.Attack / Math.max(maxValues.attack, 1)).toFixed(3)),
          ])
        ),
      },
      {
        stat: "Health",
        ...Object.fromEntries(
          selectedEntries.map(({ name, species }) => [
            name,
            Number((species.Health / Math.max(maxValues.health, 1)).toFixed(3)),
          ])
        ),
      },
      {
        stat: "Speed",
        ...Object.fromEntries(
          selectedEntries.map(({ name, species }) => [
            name,
            Number((species.Speed / Math.max(maxValues.speed, 1)).toFixed(3)),
          ])
        ),
      },
    ];
  }, [maxValues, selectedEntries]);

  const radarConfig = useMemo(() => {
    const colors = ["#38bdf8", "#a855f7", "#4ade80", "#fb923c"];
    return Object.fromEntries(
      selectedEntries.map(({ name, species }, index) => [
        name,
        {
          label: species.FullName,
          color: colors[index % colors.length],
        },
      ])
    );
  }, [selectedEntries]);

  const overallScores = useMemo(() => {
    return selectedEntries.map(({ name, species }) => {
      const attack = species.Attack / Math.max(maxValues.attack, 1);
      const health = species.Health / Math.max(maxValues.health, 1);
      const speed = species.Speed / Math.max(maxValues.speed, 1);
      const rarity = species.Rarity / Math.max(maxValues.rarity, 1);
      const score = attack * weights.attack + health * weights.health + speed * weights.speed + rarity * 0.7;
      return { name, species, score };
    });
  }, [maxValues, selectedEntries, weights]);

  const baselineEntry = selectedEntries[0] ?? null;

  const toggleSelection = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) {
        return prev.filter((item) => item !== name);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, name];
    });
  };

  const inner = (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => {
              const entry = selectedEntries[index];
              const isEmpty = !entry;
              const tier = entry ? rarityTier(entry.species.Rarity, entry.species.IsExclusive) : null;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSelectorSearch("");
                    setSelectorOpen(true);
                  }}
                  className={`group relative aspect-square w-full select-none transition-transform active:translate-y-0.5 ${tier?.shimmer ? "shimmer-rare" : ""}`}
                  style={{
                    background: tier?.color ?? "#d4e0eb",
                    borderRadius: "1.25rem",
                    boxShadow: "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
                  }}
                  title={isEmpty ? "" : `${entry.species.FullName} · Rarity ${entry.species.Rarity.toFixed(2)}${entry.species.IsExclusive ? " · DEMON" : ""}`}
                  aria-label={isEmpty ? "Empty slot" : `Filled with ${entry.species.FullName}`}
                >
                  <span className="relative z-10 block h-full w-full">
                    {entry && (
                      <div className="relative flex h-full w-full items-center justify-center p-1.5">
                        <SmartImage
                          src={iconUrl(entry.species.Icon)}
                          alt={entry.species.FullName}
                          imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                          fallbackSize={32}
                        />
                      </div>
                    )}
                  </span>
                  {isEmpty && (
                    <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-30 transition-opacity group-hover:opacity-60">
                      <PixelIcon name="plus" size={28} color="#1e3a5f" />
                    </span>
                  )}
                  {!isEmpty && (
                    <span
                      className="absolute inset-0 z-20 flex items-center justify-center rounded-[18%] bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(entry.name);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            toggleSelection(entry.name);
                          }
                        }}
                        className="grid h-10 w-10 cursor-pointer place-items-center"
                        aria-label="Remove"
                      >
                        <PixelIcon name="close" size={32} color="#ffffff" />
                      </span>
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 rounded-[18%] ring-1 ring-inset ring-white/30" />
                </button>
              );
            })}
          </div>

          {selectorOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
              onClick={() => setSelectorOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
                style={{
                  backgroundColor: "#1a1f2e",
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "40px 40px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "soft-light",
                  boxShadow: "0 -4px 0 #1e3a5f, inset 0 2px 0 rgba(255,255,255,0.1)",
                  border: "4px solid #1e3a5f",
                }}
              >
                <div
                  className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
                  style={{ background: "#7cb3ff", borderBottom: "3px solid #1e3a5f" }}
                >
                  <div>
                    <h3
                      className="text-outline text-sm text-white sm:text-base"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      SELECT BRAINROTS
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/80">
                      {selected.length}/4 selected
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectorOpen(false)}
                    className="btn-follow grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white"
                    style={{ boxShadow: "0 3px 0 #7f1d1d" }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-white/10 px-4 py-2">
                  <Input
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    placeholder="search brainrots..."
                    className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  />
                  <SortPill
                    value={selectorSortBy}
                    onChange={setSelectorSortBy}
                    options={[
                      { value: "rarity-desc", label: "Rarity ↓" },
                      { value: "rarity-asc", label: "Rarity ↑" },
                      { value: "name-az", label: "Name A-Z" },
                      { value: "name-za", label: "Name Z-A" },
                    ]}
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {(() => {
                      const allSpecies = Object.entries(state.rotsData);
                      const filtered = allSpecies
                        .filter(([name, sp]) =>
                          `${name} ${sp.ShortenedName} ${sp.FullName}`.toLowerCase().includes(selectorSearch.toLowerCase())
                        )
                        .sort((a, b) => {
                          switch (selectorSortBy) {
                            case "rarity-asc":
                              return a[1].Rarity - b[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
                            case "rarity-desc":
                              return b[1].Rarity - a[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
                            case "name-az":
                              return a[1].FullName.localeCompare(b[1].FullName);
                            case "name-za":
                              return b[1].FullName.localeCompare(a[1].FullName);
                            default:
                              return 0;
                          }
                        });

                      if (selectorSortBy === "name-az" || selectorSortBy === "name-za") {
                        const sections: { label: string; items: typeof filtered }[] = [];
                        for (const entry of filtered) {
                          const letter = (entry[1].FullName[0] || "#").toUpperCase();
                          const label = /[A-Z]/.test(letter) ? letter : "#";
                          let section = sections.find((s) => s.label === label);
                          if (!section) {
                            section = { label, items: [] };
                            sections.push(section);
                          }
                          section.items.push(entry);
                        }
                        return sections.map((section) => (
                          <div key={section.label} className="contents">
                            <div className="col-span-full flex items-center gap-3 py-3">
                              <h3
                                className="text-outline text-lg text-white sm:text-2xl"
                                style={{ fontFamily: "var(--font-pixel), monospace" }}
                              >
                                {section.label}
                              </h3>
                              <div className="h-1 flex-1 rounded-full bg-white" />
                            </div>
                            {section.items.map(([name, sp]) => {
                              const isSelected = selected.includes(name);
                              const tier = rarityTier(sp.Rarity, sp.IsExclusive);
                              return (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => toggleSelection(name)}
                                  disabled={!isSelected && selected.length >= 4}
                                  className={`group relative aspect-square cursor-pointer ${tier.shimmer ? "shimmer-rare" : ""} ${isSelected ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#1a1f2e]" : ""} disabled:opacity-40`}
                                  style={{
                                    background: tier.color,
                                    borderRadius: "1.25rem",
                                    boxShadow:
                                      "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
                                  }}
                                  title={sp.FullName}
                                >
                                  <SmartImage
                                    src={iconUrl(sp.Icon)}
                                    alt={sp.FullName}
                                    imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                                    fallbackSize={32}
                                  />
                                  {isSelected && (
                                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                      <span className="grid h-6 w-6 place-items-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900 shadow-[0 2px_0_#7f1d1d]">
                                        ✓
                                      </span>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ));
                      }

                      const sections: { label: string; color: string; items: typeof filtered }[] = [];
                      for (const entry of filtered) {
                        const tier = rarityTier(entry[1].Rarity, entry[1].IsExclusive);
                        let section = sections.find((s) => s.label === tier.label);
                        if (!section) {
                          section = { label: tier.label, color: tier.color, items: [] };
                          sections.push(section);
                        }
                        section.items.push(entry);
                      }
                      return sections.map((section) => (
                        <div key={section.label} className="contents">
                          <div className="col-span-full flex items-center gap-3 py-3">
                            <h3
                              className="text-outline text-lg text-white sm:text-2xl"
                              style={{ fontFamily: "var(--font-pixel), monospace" }}
                            >
                              {section.label}
                            </h3>
                            <div className="h-1 flex-1 rounded-full bg-white" />
                          </div>
                          {section.items.map(([name, sp]) => {
                            const isSelected = selected.includes(name);
                            const tier = rarityTier(sp.Rarity, sp.IsExclusive);
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => toggleSelection(name)}
                                disabled={!isSelected && selected.length >= 4}
                                className={`group relative aspect-square cursor-pointer ${tier.shimmer ? "shimmer-rare" : ""} ${isSelected ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#1a1f2e]" : ""} disabled:opacity-40`}
                                style={{
                                  background: tier.color,
                                  borderRadius: "1.25rem",
                                  boxShadow:
                                    "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
                                }}
                                title={sp.FullName}
                              >
                                <SmartImage
                                  src={iconUrl(sp.Icon)}
                                  alt={sp.FullName}
                                  imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                                  fallbackSize={32}
                                />
                                {isSelected && (
                                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <span className="grid h-6 w-6 place-items-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900 shadow-[0 2px_0 #7f1d1d]">
                                      ✓
                                    </span>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]">
          <button
            onClick={() => setMattersOpen((o) => !o)}
            className="btn-follow mb-3 flex w-full items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-left"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            <div>
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-900">
                2. WHAT MATTERS MOST?
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-600">
                Move the sliders to weight your overall score.
              </p>
            </div>
            <span
              style={{
                transform: mattersOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
                display: "inline-block",
              }}
            >
              ▼
            </span>
          </button>

          {mattersOpen && (
            <div>
              {(["attack", "health", "speed"] as const).map((key) => (
                <label key={key} className="mb-3 block rounded-[1rem] border border-black/20 bg-white/80 p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-700">
                    <span>{key.toUpperCase()}</span>
                    <span className="text-slate-900">{weights[key].toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-yellow-400"
                  />
                </label>
              ))}

              <div className="rounded-[1rem] border border-black/20 bg-white/80 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">
                  OVERALL SCORE
                </div>
                {overallScores.length === 0 ? (
                  <p className="text-sm text-slate-700">Select at least two brainrots to start.</p>
                ) : (
                  <div className="space-y-2">
                    {overallScores.map(({ name, species, score }) => (
                      <div key={name} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2">
                        <div>
                          <div className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                            {species.FullName}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-600">
                            {species.ShortenedName}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-yellow-700">
                          {score.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
            RADAR CHART STATS
          </h3>
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-700">
            Attack • Health • Speed
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            {selectedEntries.length >= 2 ? (
              <ChartContainer
                config={radarConfig}
                className="h-[340px] w-full"
              >
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="#7f8ea3" strokeOpacity={0.65} />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={{ fill: "#1f2937", fontSize: 13, fontWeight: 600 }}
                  />
                  <Tooltip content={<TriangleTooltip active={undefined} label={undefined} selectedEntries={selectedEntries} maxValues={maxValues} radarConfig={radarConfig} />} />
                  {selectedEntries.map(({ name }) => (
                    <Radar
                      key={name}
                      dataKey={name}
                      stroke={radarConfig[name].color}
                      fill={radarConfig[name].color}
                      fillOpacity={0.18}
                      strokeWidth={2.5}
                    />
                  ))}
                  <ChartLegend
                    verticalAlign="bottom"
                    content={<ChartLegendContent />}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div className="rounded-[1rem] border border-dashed border-black/20 bg-white/80 p-6 text-center text-sm text-slate-700">
                Select at least two brainrots to show the radar chart stats.
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">
              Weighted Breakdown
            </div>
            {selectedEntries.length >= 2 ? (
              <div className="space-y-2">
                {overallScores.map(({ name, species, score }) => {
                  const attack = species.Attack / Math.max(maxValues.attack, 1);
                  const health = species.Health / Math.max(maxValues.health, 1);
                  const speed = species.Speed / Math.max(maxValues.speed, 1);
                  const rarity = species.Rarity / Math.max(maxValues.rarity, 1);
                  const weightedAttack = attack * weights.attack;
                  const weightedHealth = health * weights.health;
                  const weightedSpeed = speed * weights.speed;
                  const weightedRarity = rarity * 0.7;

                  return (
                    <div key={name} className="rounded-xl border border-black/20 bg-white/80 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                            {species.FullName}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-600">
                            {species.ShortenedName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-yellow-700">
                            {score.toFixed(2)}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-500">
                            overall
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] uppercase tracking-wider text-slate-600">
                        <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                          <span>Attack</span>
                          <span className="font-semibold text-slate-900">{weightedAttack.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                          <span>Health</span>
                          <span className="font-semibold text-slate-900">{weightedHealth.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                          <span>Speed</span>
                          <span className="font-semibold text-slate-900">{weightedSpeed.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                          <span>Rarity</span>
                          <span className="font-semibold text-slate-900">{weightedRarity.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1rem] border border-dashed border-black/20 bg-white/80 p-6 text-center text-sm text-slate-700">
                Select at least two brainrots to see weighted breakdown.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-2 rounded-[1.5rem] border-2 border-black/30 bg-white/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="mb-3 flex items-center justify-between px-4 py-3">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
            COMPARISON
          </h3>
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-700">
            {selectedEntries.length >= 2 ? "Live comparison" : "Select 2+ brainrots"}
          </span>
        </div>

        {selectedEntries.length >= 2 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-200/90">
                  <th className="border-b-2 border-r border-black/20 px-4 py-3 text-left text-[10px] uppercase tracking-[0.25em] text-slate-800">
                    Stat
                  </th>
                  {selectedEntries.map(({ name, species }) => (
                    <th key={name} className="border-b-2 border-r border-black/20 px-4 py-3 text-center last:border-r-0">
                      <div className="text-sm font-bold uppercase tracking-wide text-slate-900">{species.FullName}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-600">{species.ShortenedName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Attack", getValue: (species: Species) => species.Attack.toFixed(1) },
                  { label: "Health", getValue: (species: Species) => species.Health.toFixed(1) },
                  { label: "Speed", getValue: (species: Species) => species.Speed.toFixed(1) },
                  { label: "Rarity", getValue: (species: Species) => species.Rarity.toFixed(1) },
                ].map((row) => (
                  <tr
                    key={row.label}
                    className={row.label === "Attack" ? "bg-white/40" : row.label === "Health" ? "bg-white/30" : row.label === "Speed" ? "bg-white/40" : "bg-white/30"}
                  >
                    <td
                      className="border-b border-r border-black/20 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.25em] text-slate-800"
                      style={{
                        backgroundImage: "url('/stud_texture.png')",
                        backgroundSize: "40px 40px",
                        backgroundRepeat: "repeat",
                        backgroundBlendMode: "overlay",
                      }}
                    >
                      {row.label}
                    </td>
                    {selectedEntries.map(({ name, species }) => {
                      const value = (() => {
                        switch (row.label) {
                          case "Attack":
                            return species.Attack;
                          case "Health":
                            return species.Health;
                          case "Speed":
                            return species.Speed;
                          case "Rarity":
                            return species.Rarity;
                          default:
                            return 0;
                        }
                      })();
                      const baselineValue = (() => {
                        if (!baselineEntry) return value;
                        switch (row.label) {
                          case "Attack":
                            return baselineEntry.species.Attack;
                          case "Health":
                            return baselineEntry.species.Health;
                          case "Speed":
                            return baselineEntry.species.Speed;
                          case "Rarity":
                            return baselineEntry.species.Rarity;
                          default:
                            return value;
                        }
                      })();

                      const delta = formatDelta(value, baselineValue);
                      const isBaseline = baselineEntry?.name === name;
                      const isPositive = !isBaseline && delta.startsWith("+");
                      const isNegative = !isBaseline && delta.startsWith("-");

                      const cellBg = isPositive
                        ? "bg-green-200/70"
                        : isNegative
                        ? "bg-red-200/70"
                        : "bg-transparent";

                      return (
                        <td
                          key={name + row.label}
                          className={`border-b border-r border-black/20 px-4 py-3 text-center last:border-r-0 ${cellBg}`}
                          style={{
                            backgroundImage: isPositive || isNegative ? "none" : "url('/stud_texture.png')",
                            backgroundSize: "40px 40px",
                            backgroundRepeat: "repeat",
                            backgroundBlendMode: "overlay",
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-base font-extrabold text-slate-900">
                              {row.getValue(species)}
                            </span>
                            {!isBaseline && (
                              <span
                                className={`text-[11px] font-bold ${
                                  isPositive
                                    ? "text-green-800"
                                    : isNegative
                                    ? "text-red-800"
                                    : "text-slate-500"
                                }`}
                              >
                                {delta}
                              </span>
                            )}
                            {isBaseline && (
                              <span className="text-[11px] font-bold text-slate-500">
                                baseline
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-slate-600">
            Search above and select at least two brainrots to start comparing them.
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return inner;
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col overflow-y-auto px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          COMPARE
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
          Compare brainrots side by side
        </p>
      </div>

      {inner}

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
