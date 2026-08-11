import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
  try {
    const items = await prisma.bagItem.findMany({
      orderBy: { name: "asc" },
    });

    const data: Record<string, { Name: string; Description: string; Icon: string; Demand: string }> = {};
    for (const item of items) {
      data[item.name] = {
        Name: item.name,
        Description: item.description,
        Icon: item.icon,
        Demand: item.demand,
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
