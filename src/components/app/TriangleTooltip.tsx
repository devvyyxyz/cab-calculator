"use client";

import { type Species } from "@/lib/cab-types";
import { SmartImage } from "@/components/trade/SmartImage";

export function TriangleTooltip({
  active,
  label,
  selectedEntries,
  maxValues,
  radarConfig,
}: {
  active?: boolean;
  label?: string;
  selectedEntries: Array<{ name: string; species: Species }>;
  maxValues: { attack: number; health: number; speed: number; rarity: number };
  radarConfig: Record<string, { label: string; color: string }>;
}) {
  if (!active || !label) {
    return null;
  }

  const statKey = `${label}`.toLowerCase() as "attack" | "health" | "speed";
  const maxValue = maxValues[statKey] || 1;

  return (
    <div className="rounded-xl border border-black/20 bg-[#f8f6ef] px-3 py-2 shadow-xl" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
      <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">{label}</div>
      <div className="space-y-1 text-sm text-slate-900">
        {selectedEntries.map(({ name, species }) => {
          const rawValue = species[statKey === "attack" ? "Attack" : statKey === "health" ? "Health" : "Speed"];
          const normalizedValue = rawValue / maxValue;
          const color = radarConfig[name]?.color ?? "#64748b";

          return (
            <div key={name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate text-[11px] uppercase tracking-wide text-slate-800">{species.ShortenedName}</span>
              </div>
              <span className="text-[11px] text-slate-700">
                {rawValue.toFixed(1)} ({Math.round(normalizedValue * 100)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
