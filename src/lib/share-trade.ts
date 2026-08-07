// ===== Trade sharing - stateless ID encoding =====
// A trade is serialized to a compact JSON object and base64url-encoded into a
// short ID. The ID is fully self-contained (no server storage), so a share
// link works from any host and the embedded image can be rebuilt on demand.

export interface ShareRot {
  i: string; // species icon filename (e.g. "73.png")
  s: string; // species shortened name
  n: string; // nickname
  l: number; // level
  v: number; // IV 0..1
  val: number; // computed value
}

export interface ShareItem {
  i: string; // bag item icon filename
  n: string; // name
  q: number; // quantity
  val: number; // computed total value
}

export interface ShareSide {
  rots: ShareRot[];
  items: ShareItem[];
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
