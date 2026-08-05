import type {
  RotsResponse,
  BagResponse,
  SkinsResponse,
  PlayerData,
} from "./cab-types";

const API = "/api/cab";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export function getRots() {
  return getJson<RotsResponse>("rots");
}
export function getBag() {
  return getJson<BagResponse>("bag");
}
export function getSkins() {
  return getJson<SkinsResponse>("skins");
}
export function getInventory(userId: string | number) {
  return getJson<{ Data: PlayerData }>(`inventory/${userId}`);
}

/** Proxied icon URL — avoids CORS issues by routing through our /api/cab proxy. */
export function iconUrl(iconFile: string): string {
  // iconFile is like "73.png"
  return `${API}/icons/${iconFile}`;
}
