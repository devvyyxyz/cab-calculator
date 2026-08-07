import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { decodeTrade, type ShareTrade } from "@/lib/share-trade";
import { getShare } from "@/lib/share-store";
import { buildTradeSvg } from "@/lib/share-image";

const ICON_BASE = "https://indieun.com/cab/icons/";

async function resolveIcons(t: ShareTrade): Promise<Record<string, string>> {
  const files = new Set<string>();
  [t.you, t.them].forEach((side) => {
    side.slots.forEach((s) => s.i && files.add(s.i));
  });
  const map: Record<string, string> = {};
  await Promise.all(
    [...files].map(async (f) => {
      try {
        const res = await fetch(ICON_BASE + f, { cache: "no-store" });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const type = res.headers.get("content-type") || "image/png";
          map[f] = `data:${type};base64,${buf.toString("base64")}`;
        }
      } catch {
        /* fall back to placeholder */
      }
    })
  );
  return map;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trade = decodeTrade(id) ?? getShare(id);
  if (!trade) {
    return new NextResponse("Invalid trade", { status: 400 });
  }

  const fmt = new URL(req.url).searchParams.get("fmt");
  const icons = await resolveIcons(trade);
  const svg = buildTradeSvg(trade, icons);

  const cacheHeaders = {
    "Cache-Control": "public, max-age=604800, immutable",
  };

  if (fmt === "svg") {
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml", ...cacheHeaders },
    });
  }

  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", ...cacheHeaders },
    });
  } catch {
    // Fall back to inline SVG if rasterization fails
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml", ...cacheHeaders },
    });
  }
}

