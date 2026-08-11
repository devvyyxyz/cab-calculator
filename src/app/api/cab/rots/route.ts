import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
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
      };
    }

    return NextResponse.json(
      { Data: data },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
