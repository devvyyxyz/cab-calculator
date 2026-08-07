import type { Metadata } from "next";
import { headers } from "next/headers";
import { decodeTrade } from "@/lib/share-trade";

const FALLBACK_HOST = "cab.devvyy.xyz";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trade = decodeTrade(id);

  let base = `https://${FALLBACK_HOST}`;
  try {
    const headerStore = await headers();
    const host =
      headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      FALLBACK_HOST;
    const proto = headerStore.get("x-forwarded-proto") || "https";
    base = `${proto}://${host}`;
  } catch {
    /* fall back to default host */
  }

  const imageUrl = `${base}/api/share/${id}/image`;

  return {
    title: trade
      ? `Trade: ${trade.you.total.toFixed(1)} vs ${trade.them.total.toFixed(1)}`
      : "CAB Trade",
    description: "Catch a Brainrot trade calculator — share a trade.",
    openGraph: {
      title: trade
        ? `CAB Trade: ${trade.you.total.toFixed(1)} vs ${trade.them.total.toFixed(1)}`
        : "CAB Trade Calculator",
      description: "A Catch a Brainrot trade, as calculated on cab.devvyy.xyz",
      siteName: "CAB Trade Calc",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "CAB trade preview",
        },
      ],
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const trade = decodeTrade(id);

  if (!trade) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0099ff",
          fontFamily: "'Courier New', monospace",
        }}
      >
        <div style={{ color: "#fff", fontSize: 18, textAlign: "center" }}>
          <h1>Invalid trade link</h1>
          <p>This share link is missing or malformed.</p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        background: "#0099ff",
      }}
    >
      <img
        src={`/api/share/${id}/image`}
        alt="CAB trade preview"
        style={{
          maxWidth: "100%",
          maxHeight: "70vh",
          width: "auto",
          height: "auto",
          borderRadius: 12,
          boxShadow: "0 8px 0 0 rgba(0,0,0,0.35)",
          imageRendering: "pixelated",
        }}
      />
      <a
        href="https://cab.devvyy.xyz/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#fff",
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          textShadow: "2px 2px 0 rgba(0,0,0,0.4)",
        }}
      >
        ← cab.devvyy.xyz
      </a>
    </main>
  );
}
