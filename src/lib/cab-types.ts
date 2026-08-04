// ===== Catch a Brainrot — Data Types =====
// Mirrors the indieun.com/cab API contract.

export interface SpawnLocation {
  World: number;
  Zone: number;
}

/** Species info for a brainrot type. */
export interface Species {
  Attack: number;
  Health: number;
  FullName: string;
  ShortenedName: string;
  Icon: string; // e.g. "73.png"
  IsExclusive: boolean;
  Rarity: number; // 1-6 (may be fractional)
  Speed: number;
  SpawnLocation?: SpawnLocation | null;
}

/** A captured brainrot instance owned by a player. */
export interface Rot {
  Box: string;
  IV: number; // 0..1
  Level: number;
  Moveset: string[];
  Nickname: string;
  Serial?: number | null;
  Species: string;
  UID: string;
}

/** Bag item info (coins, eggs, boxes, etc.). */
export interface BagItemInfo {
  Name: string;
  Description: string;
  Icon: string;
}

/** Hoverboard skin info. */
export interface HoverboardInfo {
  Name: string;
  Description: string;
  Icon: string;
  Speed: number;
}

/** A hoverboard owned by a player. */
export interface Hoverboard {
  Name: string;
  UID: string;
}

/** Full player data fetched from /inventory/<userid>. */
export interface PlayerData {
  Bag: Record<string, number>;
  PC: Rot[];
  Team: Rot[];
  Hoverboards: Hoverboard[];
}

export interface RotsResponse {
  Data: Record<string, Species>;
}
export interface BagResponse {
  Data: Record<string, BagItemInfo>;
}
export interface SkinsResponse {
  Data: Record<string, HoverboardInfo>;
}
