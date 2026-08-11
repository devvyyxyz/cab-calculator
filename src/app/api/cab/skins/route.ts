import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
  try {
    const hoverboards = await prisma.hoverboard.findMany({
      orderBy: { name: "asc" },
    });

    const data: Record<string, { Name: string; Description: string; Icon: string; Speed: number }> = {};
    for (const hb of hoverboards) {
      data[hb.name] = {
        Name: hb.name,
        Description: hb.description,
        Icon: hb.icon,
        Speed: hb.speed,
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
