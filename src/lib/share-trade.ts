// ===== Trade sharing - compact payload + stateless ID encoding =====
// A trade is reduced to just what the embedded image needs (icons + quantity +
// totals) and encoded to a base64url ID. The ID is self-contained (fallback),
// while a companion short-ID server store produces much shorter share links.

export interface ShareSlot {
  i: string; // icon filename (e.g. "73.png")
  q?: number; // quantity (items only)
}

export interface ShareSide {
  slots: ShareSlot[];
  total: number;
}

export interface ShareTrade {
  you: ShareSide;
  them: ShareSide;
}

/** Encode a trade payload into a URL-safe ID string. */
export function encodeTrade(t: ShareTrade): string {
  const json = JSON.stringify(t);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a trade ID back into a payload, or null if invalid. */
export function decodeTrade(id: string): ShareTrade | null {
  try {
    let base64 = id.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const bin = atob(base64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as ShareTrade;
    if (!parsed || !parsed.you || !parsed.them) return null;
    return parsed;
  } catch {
    return null;
  }
}

