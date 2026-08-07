import { NextRequest, NextResponse } from "next/server";
import { createShare } from "@/lib/share-store";
import type { ShareTrade } from "@/lib/share-trade";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ShareTrade;
    if (!body || !body.you || !body.them) {
      return NextResponse.json({ error: "Invalid trade" }, { status: 400 });
    }
    const id = createShare(body);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
