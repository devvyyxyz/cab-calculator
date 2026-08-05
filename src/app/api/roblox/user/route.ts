import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to Roblox username search.
 * GET /api/roblox/user?username=<name>
 *
 * Returns an array of matches: { id, name, displayName, hasVerifiedBadge }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "Missing 'username' query parameter" },
      { status: 400 }
    );
  }

  try {
    // Roblox username search endpoint (POST with body)
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Roblox API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const matches = (data.data ?? []).map(
      (u: {
        id: number;
        name: string;
        displayName: string;
        hasVerifiedBadge: boolean;
      }) => ({
        id: u.id,
        name: u.name,
        displayName: u.displayName,
        hasVerifiedBadge: u.hasVerifiedBadge,
      })
    );

    // If no exact match, also try the keyword search for similar usernames
    if (matches.length === 0) {
      try {
        const kwRes = await fetch(
          `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(
            username
          )}&limit=10`,
          { cache: "no-store" }
        );
        if (kwRes.ok) {
          const kwData = await kwRes.json();
          const kwMatches = (kwData.data ?? []).map(
            (u: {
              id: number;
              name: string;
              displayName: string;
              hasVerifiedBadge: boolean;
            }) => ({
              id: u.id,
              name: u.name,
              displayName: u.displayName,
              hasVerifiedBadge: u.hasVerifiedBadge,
            })
          );
          return NextResponse.json({ matches: kwMatches });
        }
      } catch {
        // fall through
      }
    }

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
