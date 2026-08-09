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

  const movesets = Array.from(movesetMap.entries())
    .map(([name, ownerIds]) => ({
      name,
      ownerCount: ownerIds.size,
      owners: Array.from(ownerIds),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
