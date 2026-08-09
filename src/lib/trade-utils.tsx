import { classifyItem } from "@/lib/trade-values";

export function rarityTier(
  rarity: number,
  isExclusive: boolean
): { color: string; shimmer: boolean; label: string } {
  if (isExclusive) return { color: "#FF5555", shimmer: true, label: "Exclusive" };
  if (rarity >= 5) return { color: "#AA33FF", shimmer: true, label: "Insane" };
  if (rarity >= 4) return { color: "#B27DFF", shimmer: false, label: "Epic" };
  if (rarity >= 3) return { color: "#7ED957", shimmer: false, label: "Rare" };
  if (rarity >= 2) return { color: "#FCA5A5", shimmer: false, label: "Uncommon" };
  return { color: "#E5E7EB", shimmer: false, label: "Common" };
}

export function rarityTierColor(rarity: number, isExclusive: boolean): string {
  return rarityTier(rarity, isExclusive).color;
}

export function SectionDivider({ label }: { label: string; color?: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 py-3">
      <h3
        className="text-outline text-lg text-white sm:text-2xl"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {label}
      </h3>
      <div className="h-1 flex-1 rounded-full bg-white" />
    </div>
  );
}

export function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="inline-block h-3 w-3 rounded"
        style={{ background: color }}
      />
      <span style={{ fontFamily: "var(--font-pixel), monospace" }}>{label}</span>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full grid place-items-center py-10 text-center">
      <div className="text-3xl opacity-40">📦</div>
      <p className="mt-2 text-xs text-white/50">{text}</p>
    </div>
  );
}

export function formatDelta(value: number, baseline: number): string {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) {
    return "0.0%";
  }

  const delta = ((value - baseline) / baseline) * 100;
  const rounded = delta.toFixed(1);
  return `${delta > 0 ? "+" : ""}${rounded}%`;
}
