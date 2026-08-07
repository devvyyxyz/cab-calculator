import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to Roblox avatar headshot API.
 * GET /api/roblox/avatar?userId=<id>
 *
 * Returns { imageUrl } - a direct CDN URL to the user's avatar headshot PNG.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json(
      { error: "Missing 'userId' query parameter" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(
        userId
      )}&size=150x150&format=Png&isCircular=false`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Roblox API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const entry = data.data?.[0];
    if (!entry || entry.state !== "Completed" || !entry.imageUrl) {
      return NextResponse.json(
        { error: "Avatar not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({ imageUrl: entry.imageUrl });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
