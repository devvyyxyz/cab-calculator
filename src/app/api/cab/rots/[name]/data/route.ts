import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://indieun.com/cab";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        { error: "Missing rot name" },
        { status: 400 }
      );
    }

    const res = await fetch(`${UPSTREAM}/rots`, {
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

    const data = (await res.json()) as { Data: Record<string, unknown> };
    const rotData = data.Data?.[name];

    if (!rotData) {
      return NextResponse.json(
        { error: "Rot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rotData, {
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
