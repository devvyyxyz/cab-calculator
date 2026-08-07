import type { Rot, Species, BagItemInfo } from "./cab-types";

/**
 * Trade value estimator for "Catch a Brainrot".
 *
 * Value model (community-style heuristic):
 *   - Brainrot base = species.Rarity (1..6, fractional).
 *   - IV multiplier - IV 0 → 0.6x, IV 1 → 1.4x (linear).
 *   - Level multiplier - every 10 levels adds +25% value.
 *   - Exclusive bonus - demon rots get ×1.5.
 *   - Box bonus - better capture boxes add small premium (Rot Box → Crystal Box).
 *
 *   - Bag items: tiered by name keywords (Egg, Box, Currency, Upgrade, Special).
 *     Currency (Coins/Ice Coins) valued at 1 unit each.
 *     Eggs valued higher than boxes; Legendary-tier boxes (Infinity) worth most.
 *
 *   - Hoverboards: valued by Speed stat (faster = more valuable).
 *
 * All values are returned in arbitrary "value units" used only for relative
 * comparison - not an official currency. The estimator is intentionally
 * transparent so users can see how each number is built.
 */

const BOX_TIER: Record<string, number> = {
  "Rot Box": 1.0,
  "Rare Box": 1.05,
  "Epic Box": 1.1,
  "Gold Box": 1.15,
  "Crystal Box": 1.25,
  "Frozen Box": 1.3,
  "Demon Box": 1.4,
  "Snow Box": 1.05,
  "Snowman Box": 1.1,
  "Miner Box": 1.1,
  "Silver Box": 1.05,
  "Infinity Box": 2.0, // 100% catch rate
};

export interface ValuedRot {
  rot: Rot;
  species: Species | undefined;
  value: number;
  breakdown: { label: string; amount: number }[];
}

export interface ValuedItem {
  name: string;
  icon: string;
  qty: number;
  unitValue: number;
  total: number;
  tier: string;
}

export interface TradeValueBreakdown {
  rots: ValuedRot[];
  items: ValuedItem[];
  total: number;
}

const ITEM_TIER_KEYWORDS: { test: RegExp; tier: string; value: number }[] = [
  { test: /infinity box/i, tier: "Legendary", value: 500 },
  { test: /illegal brainrot/i, tier: "Forbidden", value: 1000 },
  { test: /indieuns socks/i, tier: "Boss Drop", value: 350 },
  { test: /egg/i, tier: "Egg", value: 60 },
  { test: /(box)/i, tier: "Box", value: 25 },
  { test: /(coin|shard|card)/i, tier: "Currency", value: 1 },
  { test: /(diamond|iron|wood|key)/i, tier: "Upgrade", value: 8 },
  { test: /(candy|rot candy|snow candy)/i, tier: "Consumable", value: 15 },
];

export function classifyItem(name: string): { tier: string; value: number } {
  for (const { test, tier, value } of ITEM_TIER_KEYWORDS) {
    if (test.test(name)) return { tier, value };
  }
  return { tier: "Misc", value: 5 };
}

export function valueRot(rot: Rot, species?: Species): ValuedRot {
  const breakdown: { label: string; amount: number }[] = [];

  if (!species) {
    // Unknown species - small flat value based on level
    const v = Math.max(1, rot.Level * 0.5);
    breakdown.push({ label: "Unknown species (level-only)", amount: v });
    return { rot, species, value: v, breakdown };
  }

  const base = species.Rarity * 10;
  breakdown.push({ label: `Base (rarity ${species.Rarity.toFixed(2)})`, amount: base });

  // IV multiplier: 0 -> 0.6, 1 -> 1.4
  const ivMult = 0.6 + rot.IV * 0.8;
  const ivBoost = base * ivMult - base;
  breakdown.push({
    label: `IV ${(rot.IV * 100).toFixed(0)}% (×${ivMult.toFixed(2)})`,
    amount: ivBoost,
  });

  // Level multiplier: +25% per 10 levels
  const lvlMult = 1 + Math.floor(rot.Level / 10) * 0.25;
  const lvlBoost = base * lvlMult - base;
  breakdown.push({
    label: `Level ${rot.Level} (×${lvlMult.toFixed(2)})`,
    amount: lvlBoost,
  });

  // Exclusive bonus (demon rots)
  if (species.IsExclusive) {
    const ex = base * 0.5;
    breakdown.push({ label: "Exclusive demon rot (+50%)", amount: ex });
  }

  // Box bonus
  const boxMult = BOX_TIER[rot.Box] ?? 1.0;
  if (boxMult > 1.0) {
    const boxBoost = base * (boxMult - 1.0);
    breakdown.push({
      label: `Captured in ${rot.Box} (×${boxMult.toFixed(2)})`,
      amount: boxBoost,
    });
  }

  const value = Math.max(
    1,
    breakdown.reduce((s, b) => s + b.amount, 0)
  );

  return { rot, species, value, breakdown };
}

export function valueItem(
  name: string,
  info: BagItemInfo | undefined,
  qty: number
): ValuedItem {
  const { tier, value } = classifyItem(name);
  return {
    name,
    icon: info?.Icon ?? "",
    qty,
    unitValue: value,
    total: value * qty,
    tier,
  };
}

export function sumTrade(
  rots: ValuedRot[],
  items: ValuedItem[]
): TradeValueBreakdown {
  const r = rots.reduce((s, r) => s + r.value, 0);
  const i = items.reduce((s, i) => s + i.total, 0);
  return { rots, items, total: r + i };
}

export interface TradeVerdict {
  winner: "you" | "them" | "fair";
  yourValue: number;
  theirValue: number;
  diff: number;
  percent: number; // % advantage for winner
  label: string; // human label like "HUGE WIN", "FAIR", "LOSS"
  color: string; // hex for verdict pill
}

export function verdict(
  yourTotal: number,
  theirTotal: number
): TradeVerdict {
  const diff = yourTotal - theirTotal;
  const denom = Math.max(yourTotal, theirTotal, 1);
  const percent = Math.abs(diff) / denom;

  let winner: TradeVerdict["winner"] = "fair";
  if (diff > 0.5) winner = "you";
  else if (diff < -0.5) winner = "them";

  let label = "FAIR TRADE";
  let color = "#f5d76e"; // amber

  if (winner === "you") {
    if (percent > 0.5) {
      label = "HUGE WIN";
      color = "#22c55e";
    } else if (percent > 0.2) {
      label = "WIN";
      color = "#84cc16";
    } else {
      label = "SLIGHT WIN";
      color = "#bef264";
    }
  } else if (winner === "them") {
    if (percent > 0.5) {
      label = "HUGE LOSS";
      color = "#ef4444";
    } else if (percent > 0.2) {
      label = "LOSS";
      color = "#f97316";
    } else {
      label = "SLIGHT LOSS";
      color = "#fb923c";
    }
  }

  return {
    winner,
    yourValue: yourTotal,
    theirValue: theirTotal,
    diff,
    percent,
    label,
    color,
  };
}
