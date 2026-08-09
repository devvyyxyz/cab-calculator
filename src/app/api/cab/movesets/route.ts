import { NextRequest, NextResponse } from "next/server";

const PROBE_IDS = [
  "1629774725",
  "1559610713",
  "1234567890",
  "9876543210",
  "1112223333",
  "4445556666",
  "7778889999",
  "1029384756",
];

interface MovesetInfo {
  name: string;
  energy: number;
  type: "damage" | "healing" | "utility";
  demonExclusive: boolean;
  ownerCount: number;
  owners: string[];
}

const MOVESET_META: Record<string, Omit<MovesetInfo, "ownerCount" | "owners">> = {
  Charge: { name: "Charge", energy: 0, type: "utility", demonExclusive: false },
  Shoot: { name: "Shoot", energy: 2, type: "damage", demonExclusive: false },
  Shield: { name: "Shield", energy: 2, type: "healing", demonExclusive: false },
  Heal: { name: "Heal", energy: 2, type: "healing", demonExclusive: false },
  Splash: { name: "Splash", energy: 2, type: "utility", demonExclusive: false },
  Feathers: { name: "Feathers", energy: 2, type: "utility", demonExclusive: false },
  Trident: { name: "Trident", energy: 2, type: "damage", demonExclusive: false },
  Zap: { name: "Zap", energy: 3, type: "damage", demonExclusive: true },
  "Wheel Attack": { name: "Wheel Attack", energy: 3, type: "damage", demonExclusive: false },
  MrBeast: { name: "MrBeast", energy: 3, type: "damage", demonExclusive: false },
  Fry: { name: "Fry", energy: 3, type: "damage", demonExclusive: false },
  Sword: { name: "Sword", energy: 3, type: "damage", demonExclusive: false },
  Bite: { name: "Bite", energy: 3, type: "damage", demonExclusive: false },
  Bats: { name: "Bats", energy: 3, type: "damage", demonExclusive: true },
  "Fire Blast": { name: "Fire Blast", energy: 4, type: "damage", demonExclusive: true },
  Firework: { name: "Firework", energy: 4, type: "damage", demonExclusive: true },
  Bomb: { name: "Bomb", energy: 4, type: "damage", demonExclusive: true },
  Match: { name: "Match", energy: 4, type: "utility", demonExclusive: true },
  "Grow A Garden": { name: "Grow A Garden", energy: 5, type: "healing", demonExclusive: true },
  Arm: { name: "Arm", energy: 5, type: "damage", demonExclusive: true },
  Whirlpool: { name: "Whirlpool", energy: 6, type: "damage", demonExclusive: true },
};

export async function GET(_req: NextRequest) {
  const movesetMap = new Map<string, Set<string>>();

  const fetchInventory = async (id: string) => {
    try {
      const res = await fetch(`https://indieun.com/cab/inventory/${id}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { Data?: { PC?: Array<{ Moveset?: string[] }> } };
      const pc = data?.Data?.PC;
      if (!Array.isArray(pc)) return;
      for (const rot of pc) {
        const moves = Array.isArray(rot.Moveset) ? rot.Moveset : [];
        for (const move of moves) {
          const trimmed = move.trim();
          if (!trimmed) continue;
          const set = movesetMap.get(trimmed) ?? new Set<string>();
          set.add(id);
          movesetMap.set(trimmed, set);
        }
      }
    } catch {
      // ignore probe failures
    }
  };

  await Promise.all(PROBE_IDS.map((id) => fetchInventory(id)));

  const movesets: MovesetInfo[] = Array.from(movesetMap.entries())
    .map(([name, ownerIds]) => {
      const meta = MOVESET_META[name] ?? { name, energy: 99, type: "utility", demonExclusive: false };
      return {
        ...meta,
        ownerCount: ownerIds.size,
        owners: Array.from(ownerIds),
      };
    })
    .sort((a, b) => a.energy - b.energy || a.name.localeCompare(b.name));

  return NextResponse.json(
    { movesets },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
