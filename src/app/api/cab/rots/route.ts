import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://indieun.com/cab";

async function tryUpstream(path: string) {
  const res = await fetch(`${UPSTREAM}/${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Upstream ${path} returned ${res.status}`);
  }
  const text = await res.text();
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET(_req: NextRequest) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const species = await prisma.species.findMany({
        orderBy: { name: "asc" },
      });

      const data: Record<string, {
        FullName: string;
        ShortenedName: string;
        Icon: string;
        Attack: number;
        Health: number;
        Speed: number;
        Rarity: number;
        IsExclusive: boolean;
        Exists?: number;
        SpawnLocation?: { World: number; Zone: number } | null;
        Demand: string;
      }> = {};

      for (const sp of species) {
        data[sp.name] = {
          FullName: sp.fullName,
          ShortenedName: sp.shortenedName,
          Icon: sp.icon,
          Attack: sp.attack,
          Health: sp.health,
          Speed: sp.speed,
          Rarity: sp.rarity,
          IsExclusive: sp.isExclusive,
          Exists: sp.exists ?? undefined,
          SpawnLocation: sp.spawnWorld !== null && sp.spawnZone !== null
            ? { World: sp.spawnWorld, Zone: sp.spawnZone }
            : null,
          Demand: sp.demand,
        };
      }

      await prisma.$disconnect();

      return NextResponse.json(
        { Data: data },
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        }
      );
    } catch (dbErr) {
      await prisma.$disconnect();
      console.warn("Database unavailable for rots, falling back to upstream:", dbErr);
      return tryUpstream("rots");
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
