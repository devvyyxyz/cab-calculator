import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://indieun.com/cab";

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${UPSTREAM}/bag`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
