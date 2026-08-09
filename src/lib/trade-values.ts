import type { Rot, Species, BagItemInfo } from "./cab-types";

/**
 * Official value methods per server announcement.
 *
 * Dev:   ((rarity x 1000) / exists) + 100
 * Rot:   ((rarity x 1000) / exists) + 100 + skill_value
 *
 * When `exists` is not available in the species data, we fall back to the
 * legacy heuristic so the app still produces usable numbers.
 */

export type ValueMethod = "dev" | "rot";

export interface ValueMethodOption {
  id: ValueMethod;
  label: string;
  description: string;
}

export const VALUE_METHODS: ValueMethodOption[] = [
  {
    id: "dev",
    label: "Dev",
    description: "((rarity × 1000) / exists) + 100",
  },
  {
    id: "rot",
    label: "Rot",
    description: "((rarity × 1000) / exists) + 100 + skill_value",
  },
];

const LEGACY_BOX_TIER: Record<string, number> = {
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
  "Infinity Box": 2.0,
};

const SKILL_VALUE: Record<string, number> = {
  Charge: 1,
  Feathers: 2,
  Fry: 3,
  "MrBeast": 8,
  "Wheel Attack": 5,
  "Fire Blast": 7,
  "Grow A Garden": 4,
  Shield: 2,
  Bomb: 6,
  Shoot: 3,
  Bite: 4,
  Firework: 5,
  Match: 2,
  Slap: 1,
  Growl: 1,
  Tackle: 1,
  "Water Gun": 3,
  Ember: 3,
  "Quick Attack": 4,
  "Solar Beam": 9,
  "Thunder Shock": 6,
  "Ice Shard": 5,
  "Earthquake": 10,
  "Poison Sting": 3,
  "Wing Attack": 5,
  "Bone Rush": 6,
  "Shadow Ball": 7,
  "Dragon Rage": 8,
  "Steel Wing": 4,
  "Absorb": 3,
  "Confusion": 5,
  "Psychic": 9,
  "Fury Attack": 4,
  "Horn Drill": 10,
  "Leech Life": 4,
  "Mega Drain": 5,
  "Pay Day": 3,
  "Pin Missile": 6,
  "Razor Leaf": 5,
  "Rock Slide": 7,
  "Sonic Boom": 3,
  "String Shot": 1,
  "Transform": 7,
  "Barrier": 3,
  "Double Kick": 5,
  "Flash": 2,
  "Hydro Pump": 9,
  "Jump Kick": 7,
  "Kinesis": 4,
  "Lick": 2,
  "Mimic": 3,
  "Night Shade": 5,
  "Recover": 6,
  "Rest": 2,
  "Screech": 1,
  "Seismic Toss": 6,
  "Sharpen": 1,
  "Sing": 4,
  "Stun Spore": 3,
  "Substitute": 5,
  "Swift": 3,
  "Teleport": 2,
  "Tri Attack": 7,
  "Whirlwind": 4,
  "Agility": 3,
  "Amnesia": 4,
  "Barrage": 3,
  "Bide": 5,
  "Clamp": 4,
  "Constrict": 2,
  "Defense Curl": 1,
  Dig: 5,
  "Dizzy Punch": 5,
  "Double Edge": 8,
  "Double Team": 2,
  "Egg Bomb": 6,
  Explosion: 10,
  "Fury Swipes": 4,
  Glare: 4,
  Gust: 2,
  "Hyper Beam": 10,
  Jump: 3,
  Kick: 4,
  "Leech Seed": 3,
  "Lovely Kiss": 5,
  Meditate: 2,
  Minimize: 1,
  "Pay Day": 3,
  "Petal Dance": 7,
  Rage: 4,
  "Rapid Spin": 4,
  "Razor Wind": 6,
  Reflect: 4,
  Roar: 3,
  "Rock Throw": 4,
  Rollout: 4,
  "Sand Attack": 2,
  Scratch: 1,
  "Self-Destruct": 9,
  "Skull Bash": 8,
  "Sky Attack": 8,
  Sludge: 5,
  Smog: 3,
  "Soft-Boiled": 6,
  Splash: 1,
  Stockpile: 2,
  Strength: 6,
  "String Shot": 1,
  Submission: 7,
  "Super Fang": 7,
  Supersonic: 2,
  "Take Down": 5,
  Teleport: 2,
  Thunder: 8,
  Thunderbolt: 8,
  Toxic: 5,
  "Vice Grip": 3,
  "Vine Whip": 3,
  Waterfall: 6,
  Withdraw: 2,
};

function getSkillValue(skill: string): number {
  return SKILL_VALUE[skill] ?? 1;
}

function getSkillValueSum(moveset: string[]): number {
  return moveset.reduce((sum, skill) => sum + getSkillValue(skill), 0);
}

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

export function valueRot(rot: Rot, species?: Species, method: ValueMethod = "dev"): ValuedRot {
  const breakdown: { label: string; amount: number }[] = [];

  if (!species) {
    const v = Math.max(1, rot.Level * 0.5);
    breakdown.push({ label: "Unknown species (level-only)", amount: v });
    return { rot, species, value: v, breakdown };
  }

  const exists = species.Exists ?? 0;

  if (exists > 0) {
    const base = (species.Rarity * 1000) / exists + 100;
    breakdown.push({
      label: `Official (rarity ${species.Rarity.toFixed(2)} / exists ${exists})`,
      amount: base,
    });

    if (method === "rot") {
      const skillValue = getSkillValueSum(rot.Moveset);
      const skillBoost = skillValue;
      breakdown.push({
        label: `Skill value (${rot.Moveset.length} moves)`,
        amount: skillBoost,
      });

      const total = base + skillBoost;
      return { rot, species, value: Math.max(1, total), breakdown };
    }

    return { rot, species, value: Math.max(1, base), breakdown };
  }

  // Fallback when exists count is not available
  const base = species.Rarity * 10;
  breakdown.push({ label: `Base (rarity ${species.Rarity.toFixed(2)})`, amount: base });

  const ivMult = 0.6 + rot.IV * 0.8;
  const ivBoost = base * ivMult - base;
  breakdown.push({
    label: `IV ${(rot.IV * 100).toFixed(0)}% (×${ivMult.toFixed(2)})`,
    amount: ivBoost,
  });

  const lvlMult = 1 + Math.floor(rot.Level / 10) * 0.25;
  const lvlBoost = base * lvlMult - base;
  breakdown.push({
    label: `Level ${rot.Level} (×${lvlMult.toFixed(2)})`,
    amount: lvlBoost,
  });

  if (species.IsExclusive) {
    const ex = base * 0.5;
    breakdown.push({ label: "Exclusive demon rot (+50%)", amount: ex });
  }

  const boxMult = LEGACY_BOX_TIER[rot.Box] ?? 1.0;
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
      color = "#84cc81";
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