import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { discordId, discordName, yourOffer, theirOffer, yourTotal, theirTotal, verdict } = body;

    if (!yourOffer || !theirOffer || typeof yourTotal !== "number" || typeof theirTotal !== "number" || !verdict) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.create({
      data: {
        discordId: discordId ?? null,
        discordName: discordName ?? null,
        yourOffer: JSON.stringify(yourOffer),
        theirOffer: JSON.stringify(theirOffer),
        yourTotal,
        theirTotal,
        verdict,
      },
    });

    return NextResponse.json({ success: true, id: transaction.id });
  } catch (error) {
    console.error("Failed to save transaction:", error);
    return NextResponse.json(
      { error: "Failed to save transaction" },
      { status: 500 }
    );
  }
}
