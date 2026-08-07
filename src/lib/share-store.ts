// ===== Server-side short-ID store for trade shares =====
// Kept in a process-scoped Map (persists across requests for the life of the
// server). The deployment runs as a persistent Node server (Caddy -> next),
// so short links resolve reliably. Uses globalThis so it survives HMR in dev.

import type { ShareTrade } from "./share-trade";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

type Store = Map<string, ShareTrade>;

const g = globalThis as unknown as { __cabShares?: Store };
const store: Store = (g.__cabShares ??= new Map());

function randomId(len: number): string {
  let s = "";
  const rand = new Uint32Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(rand);
  } else {
    for (let i = 0; i < len; i++) rand[i] = Math.floor(Math.random() * 0xffffffff);
  }
  for (let i = 0; i < len; i++) s += CHARS[rand[i] % CHARS.length];
  return s;
}

/** Store a trade and return a short unique ID. */
export function createShare(t: ShareTrade): string {
  let id = "";
  do {
    id = randomId(6);
  } while (store.has(id));
  store.set(id, t);
  return id;
}

/** Look up a trade by its short ID, or null if unknown. */
export function getShare(id: string): ShareTrade | null {
  return store.get(id) ?? null;
}
