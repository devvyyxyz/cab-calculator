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
      const hoverboards = await prisma.hoverboard.findMany({
        orderBy: { name: "asc" },
      });

      const data: Record<string, { Name: string; Description: string; Icon: string; Speed: number; Demand: string }> = {};
      for (const hb of hoverboards) {
        data[hb.name] = {
          Name: hb.name,
          Description: hb.description,
          Icon: hb.icon,
          Speed: hb.speed,
          Demand: hb.demand,
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
      console.warn("Database unavailable for skins, falling back to upstream:", dbErr);
      return tryUpstream("skins");
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
