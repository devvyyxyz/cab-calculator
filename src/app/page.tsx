"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PixelButton } from "@/components/trade/PixelButton";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";
import { SideNav, type NavView } from "@/components/trade/SideNav";
import { Preloader } from "@/components/trade/Preloader";
import { Onboarding } from "@/components/trade/Onboarding";
import { SmartImage } from "@/components/trade/SmartImage";
import { SortPill } from "@/components/trade/SortPill";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { usePersistentState } from "@/components/trade/usePersistentState";
import { ItemDetailModal } from "@/components/trade/ItemDetailModal";
import {
  getRots,
  getBag,
  getInventory,
  iconUrl,
} from "@/lib/cab-client";
import type {
  PlayerData,
  Rot,
  Species,
  BagItemInfo,
  BagResponse,
  RotsResponse,
} from "@/lib/cab-types";
import {
  valueRot,
  valueItem,
  verdict,
  classifyItem,
  type ValuedRot,
  type ValuedItem,
  type TradeVerdict,
} from "@/lib/trade-values";

const SLOTS_PER_PANEL = 12; // 4 cols x 3 rows

const DEMO_YOU_ID = "1559610713"; // fallback only - real flow uses onboarding

interface Offer {
  rots: Rot[]; // selected rots (max ~6 by game rules, but allow up to SLOTS_PER_PANEL)
  items: { name: string; qty: number }[]; // distinct items
}

const EMPTY_OFFER: Offer = { rots: [], items: [] };

export default function Home() {
  // Onboarding - runs until the user confirms their Roblox account
  const [onboarded, setOnboarded] = useState(false);
  const [youProfile, setYouProfile] = useState<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  } | null>(null);

  const [yourData, setYourData] = useState<PlayerData | null>(null);

  const [rotsData, setRotsData] = useState<Record<string, Species>>({});
  const [bagData, setBagData] = useState<Record<string, BagItemInfo>>({});

  const [yourOffer, setYourOffer] = useState<Offer>(EMPTY_OFFER);
  const [theirOffer, setTheirOffer] = useState<Offer>(EMPTY_OFFER);

  const [inventoryOpenFor, setInventoryOpenFor] = useState<"you" | "them" | null>(
    null
  );

  const [loading, setLoading] = useState<"you" | "meta" | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [navView, setNavView] = useState<NavView>("trade");

  // Account switch modal
  const [showAccountModal, setShowAccountModal] = useState(false);

  // ----- ESC key closes any open modal/drawer -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inventoryOpenFor) {
        setInventoryOpenFor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inventoryOpenFor]);

  // ----- Load meta (rots + bag) once, with localStorage caching -----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try cached data first for instant load
      try {
        const cachedRots = localStorage.getItem("cab_rots_cache");
        const cachedBag = localStorage.getItem("cab_bag_cache");
        if (cachedRots && cachedBag) {
          const r = JSON.parse(cachedRots) as RotsResponse;
          const b = JSON.parse(cachedBag) as BagResponse;
          if (r?.Data && b?.Data) {
            setRotsData(r.Data);
            setBagData(b.Data);
            setMetaLoaded(true);
          }
        }
      } catch {
        /* ignore corrupt cache */
      }

      // Always fetch fresh data in background to update cache
      setLoading("meta");
      try {
        const [r, b] = await Promise.all([getRots(), getBag()]);
        if (cancelled) return;
        setRotsData((r as RotsResponse).Data);
        setBagData((b as BagResponse).Data);
        // Save to cache
        try {
          localStorage.setItem("cab_rots_cache", JSON.stringify(r));
          localStorage.setItem("cab_bag_cache", JSON.stringify(b));
        } catch {
          /* ignore quota */
        }
      } catch (e) {
        toast.error(`Failed to load game data: ${(e as Error).message}`);
      } finally {
        if (!cancelled) {
          setLoading(null);
          setMetaLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ----- Load inventory for "you" side (with localStorage caching) -----
  const loadYourInventory = useCallback(async (userId: string) => {
    setLoading("you");
    try {
      const res = await getInventory(userId.trim());
      const data = (res as { Data: PlayerData }).Data;
      setYourData(data);
      setYourOffer(EMPTY_OFFER);
      // Cache the inventory
      try {
        localStorage.setItem(`cab_inventory_${userId}`, JSON.stringify(data));
      } catch {
        /* ignore quota */
      }
      toast.success(
        `Loaded your inventory - ${data.PC.length} rots, ${data.Team.length} team, ${Object.keys(data.Bag).length} bag items`
      );
    } catch (e) {
      // Try cached inventory as fallback
      try {
        const cached = localStorage.getItem(`cab_inventory_${userId}`);
        if (cached) {
          const data = JSON.parse(cached) as PlayerData;
          setYourData(data);
          setYourOffer(EMPTY_OFFER);
          toast(`Loaded cached inventory (API unavailable)`);
          return;
        }
      } catch {
        /* ignore */
      }
      toast.error(
        `No Catch a Brainrot inventory found for this Roblox account. You can still use the catalog picker.`
      );
    } finally {
      setLoading(null);
    }
  }, []);

  // ----- Onboarding complete - fetch inventory, dismiss modal, save to localStorage -----
  const handleOnboarded = useCallback(
    (userId: string, displayName: string, avatarUrl?: string) => {
      setYouProfile({ id: userId, displayName, avatarUrl });
      setOnboarded(true);
      // Save to localStorage so refresh shows "Is this you?" directly
      try {
        localStorage.setItem(
          "cab_profile",
          JSON.stringify({ id: userId, displayName, avatarUrl })
        );
      } catch {
        /* ignore quota errors */
      }
      void loadYourInventory(userId);
    },
    [loadYourInventory]
  );

  // ----- Switch account - clear profile and return to onboarding -----
  const handleSwitchAccount = useCallback(() => {
    try {
      localStorage.removeItem("cab_profile");
      if (youProfile?.id) {
        localStorage.removeItem("cab_inventory_" + youProfile.id);
      }
    } catch {
      /* ignore */
    }
    setShowAccountModal(false);
    window.location.reload();
  }, [youProfile]);

  // ----- On mount: check localStorage for saved profile -----
  // Uses a mounted flag so SSR and client first-render both start with null,
  // then the client updates after mount once localStorage is available.
  // This avoids hydration mismatches (server can't read localStorage).
  const [savedProfile, setSavedProfile] = useState<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("cab_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id && parsed?.displayName) {
          setSavedProfile(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ----- Offer manipulation -----
  // For "you" side: rot must come from loaded inventory (real UID).
  // For "them" side: any rot can be added - we generate a synthetic UID.
  const addRot = useCallback((side: "you" | "them", rot: Rot) => {
    const set = side === "you" ? setYourOffer : setTheirOffer;
    set((prev) => {
      const total = prev.rots.length + prev.items.length;
      if (total >= SLOTS_PER_PANEL) {
        toast.error("Offer is full (max 12 slots)");
        return prev;
      }
      if (prev.rots.some((r) => r.UID === rot.UID)) {
        toast.error("Already in offer");
        return prev;
      }
      return { ...prev, rots: [...prev.rots, rot] };
    });
  }, []);

  // Add a rot from the game catalog (species) to the "them" side - used when
  // there's no inventory to pull from. Generates a synthetic UID.
  const addCatalogRot = useCallback((speciesName: string) => {
    const sp = rotsData[speciesName];
    if (!sp) return;
    const syntheticRot: Rot = {
      Box: "Rot Box",
      IV: 0.5,
      Level: 1,
      Moveset: [],
      Nickname: sp.ShortenedName,
      Serial: null,
      Species: speciesName,
      UID: `CAT-${speciesName}-${Date.now()}`,
    };
    addRot("them", syntheticRot);
  }, [rotsData, addRot]);

  const removeRot = useCallback((side: "you" | "them", uid: string) => {
    const set = side === "you" ? setYourOffer : setTheirOffer;
    set((prev) => ({
      ...prev,
      rots: prev.rots.filter((r) => r.UID !== uid),
    }));
  }, []);

  const addItem = useCallback((side: "you" | "them", name: string, qty: number) => {
    const set = side === "you" ? setYourOffer : setTheirOffer;
    set((prev) => {
      const total = prev.rots.length + prev.items.reduce((s, i) => s + 1, 0);
      const existing = prev.items.find((i) => i.name === name);
      if (!existing && total >= SLOTS_PER_PANEL) {
        toast.error("Offer is full (max 12 slots)");
        return prev;
      }
      return {
        ...prev,
        items: existing
          ? prev.items.map((i) =>
              i.name === name ? { ...i, qty: i.qty + qty } : i
            )
          : [...prev.items, { name, qty }],
      };
    });
  }, []);

  const removeItem = useCallback((side: "you" | "them", name: string) => {
    const set = side === "you" ? setYourOffer : setTheirOffer;
    set((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.name !== name),
    }));
  }, []);

  // ----- Value calculations -----
  const yourValued: ValuedRot[] = useMemo(
    () =>
      yourOffer.rots.map((r) =>
        valueRot(r, rotsData[r.Species])
      ),
    [yourOffer.rots, rotsData]
  );
  const theirValued: ValuedRot[] = useMemo(
    () =>
      theirOffer.rots.map((r) => valueRot(r, rotsData[r.Species])),
    [theirOffer.rots, rotsData]
  );

  const yourItems: ValuedItem[] = useMemo(
    () =>
      yourOffer.items.map((i) =>
        valueItem(i.name, bagData[i.name], i.qty)
      ),
    [yourOffer.items, bagData]
  );
  const theirItems: ValuedItem[] = useMemo(
    () =>
      theirOffer.items.map((i) =>
        valueItem(i.name, bagData[i.name], i.qty)
      ),
    [theirOffer.items, bagData]
  );

  const yourTotal = useMemo(
    () =>
      yourValued.reduce((s, r) => s + r.value, 0) +
      yourItems.reduce((s, i) => s + i.total, 0),
    [yourValued, yourItems]
  );
  const theirTotal = useMemo(
    () =>
      theirValued.reduce((s, r) => s + r.value, 0) +
      theirItems.reduce((s, i) => s + i.total, 0),
    [theirValued, theirItems]
  );

  const v = useMemo(() => verdict(yourTotal, theirTotal), [yourTotal, theirTotal]);

  // ----- Render helpers -----
  const renderOfferSlots = (side: "you" | "them") => {
    const offer = side === "you" ? yourOffer : theirOffer;
    const slots: React.ReactNode[] = [];

    offer.rots.forEach((rot) => {
      slots.push(
        <TradeSlot
          key={`rot-${rot.UID}`}
          variant={side}
          onRemove={() => removeRot(side, rot.UID)}
        >
          <RotSlotContent rot={rot} species={rotsData[rot.Species]} />
        </TradeSlot>
      );
    });

    offer.items.forEach((item) => {
      slots.push(
        <TradeSlot
          key={`item-${item.name}`}
          variant={side}
          onRemove={() => removeItem(side, item.name)}
        >
          <ItemSlotContent
            icon={bagData[item.name]?.Icon ?? ""}
            qty={item.qty}
            label={item.name}
          />
        </TradeSlot>
      );
    });

    // Fill rest with empty slots
    while (slots.length < SLOTS_PER_PANEL) {
      slots.push(
        <TradeSlot
          key={`empty-${slots.length}`}
          variant={side}
          empty
          onClick={() => setInventoryOpenFor(side)}
        />
      );
    }

    return slots;
  };

  return (
    <>
      <Preloader />
      {/* Game data preloader - stays until rots + bag are loaded */}
      <Preloader visible={!metaLoaded} message="LOADING GAME DATA" />
      {!onboarded && (
        <Onboarding
          onConfirm={handleOnboarded}
          initialProfile={mounted ? savedProfile : null}
        />
      )}
      <SideNav
        active={navView}
        onNavigate={setNavView}
        profile={youProfile}
        onProfileClick={() => setShowAccountModal(true)}
      />
      <main
        suppressHydrationWarning
        className="relative flex h-screen w-full flex-col overflow-hidden pl-16 sm:pl-20"
        style={{
          backgroundColor: "#0099ff",
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "100px 100px",
          backgroundRepeat: "repeat",
        }}
      >
      {/* ===== TRADE VIEW ===== */}
      {navView === "trade" && (
        <div className="relative z-10 flex h-full w-full flex-col">
          {/* Header - fixed */}
          <div className="shrink-0 px-4 pt-4 sm:px-6">
            <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
              <h2
                className="text-outline text-center text-2xl text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                TRADE CALCULATOR
              </h2>
            </div>
          </div>

          {/* Trade content */}
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-44 sm:px-6 sm:pb-28">
            <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">
            <TradePanel
              title="YOUR OFFER"
              variant="you"
              total={yourTotal}
              valuedRots={yourValued}
              items={yourItems}
            >
              {renderOfferSlots("you")}
            </TradePanel>

            {/* Mobile: fairness badge as a normal grid item between the two panels */}
            <div className="flex justify-center md:hidden">
              <FairnessBadge verdict={v} />
            </div>

            {/* Desktop: fairness badge absolutely centered over the gap */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:block">
              <FairnessBadge verdict={v} />
            </div>

            <TradePanel
              title="THEIR OFFER"
              variant="them"
              total={theirTotal}
              valuedRots={theirValued}
              items={theirItems}
            >
              {renderOfferSlots("them")}
            </TradePanel>
          </section>
          </div>
        </div>
      )}

      {/* ===== INVENTORY VIEW ===== */}
      {navView === "inventory" && (
        <InventoryView
          youProfile={youProfile}
          yourData={yourData}
          rotsData={rotsData}
          bagData={bagData}
          loading={loading === "you"}
        />
      )}

      {/* ===== BRAINROTS VIEW ===== */}
      {navView === "rots" && (
        <BrainrotsView rotsData={rotsData} />
      )}

      {/* ===== ITEMS VIEW ===== */}
      {navView === "skins" && (
        <ItemsView bagData={bagData} />
      )}

      {/* ===== VALUES VIEW ===== */}
      {navView === "values" && (
        <ValuesView rotsData={rotsData} bagData={bagData} />
      )}

      {/* ===== NEWS VIEW ===== */}
      {navView === "news" && <NewsView />}

      {/* ===== SETTINGS VIEW ===== */}
      {navView === "settings" && (
        <SettingsView
          profile={youProfile}
          onLogout={() => {
            try {
              localStorage.removeItem("cab_profile");
              localStorage.removeItem("cab_inventory_" + youProfile?.id);
            } catch {
              /* ignore */
            }
            window.location.reload();
          }}
        />
      )}

      {/* ===== ABOUT VIEW ===== */}
      {navView === "about" && (
        <AboutView rotsData={rotsData} bagData={bagData} yourData={yourData} />
      )}

      {/* Inventory / Catalog drawer */}
      {inventoryOpenFor && (
        <InventoryDrawer
          side={inventoryOpenFor}
          data={inventoryOpenFor === "you" ? yourData : null}
          rotsData={rotsData}
          bagData={bagData}
          onClose={() => setInventoryOpenFor(null)}
          onAddRot={(rot) => addRot(inventoryOpenFor, rot)}
          onAddItem={(name, qty) => addItem(inventoryOpenFor, name, qty)}
          onAddCatalogRot={(speciesName) => addCatalogRot(speciesName)}
          offerRots={
            inventoryOpenFor === "you" ? yourOffer.rots : theirOffer.rots
          }
          offerItems={
            inventoryOpenFor === "you" ? yourOffer.items : theirOffer.items
          }
        />
      )}

      {/* Account Switch Modal */}
      <AccountSwitchModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConfirm={handleSwitchAccount}
        profile={youProfile}
      />

      </main>
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FairnessBadge({ verdict }: { verdict: TradeVerdict }) {
  // If YOUR offer is worth MORE than theirs, you're overpaying = bad (red −)
  // If THEIR offer is worth MORE than yours, you're getting a deal = good (green +)
  // If equal = fair (amber =)
  const youWin = verdict.winner === "them"; // they're giving more = you win
  const symbol = youWin ? "+" : verdict.winner === "you" ? "−" : "=";
  const color = youWin ? "#22c55e" : verdict.winner === "you" ? "#ef4444" : "#fbbf24";
  const borderColor = youWin ? "#14532d" : verdict.winner === "you" ? "#7f1d1d" : "#92400e";
  const textColor = verdict.winner === "fair" ? "#1f2937" : "#ffffff";

  return (
    <div style={{ pointerEvents: "auto" }}>
      <div
        className="relative grid h-14 w-14 place-items-center rounded-full sm:h-16 sm:w-16"
        style={{
          background: color,
          border: `4px solid ${borderColor}`,
          boxShadow: `0 4px 0 0 ${borderColor}`,
          fontFamily: "var(--font-pixel), monospace",
        }}
        title={
          verdict.winner === "fair"
            ? "Fair trade"
            : verdict.winner === "you"
            ? `You're ahead by ${Math.abs(verdict.diff).toFixed(1)} (${(verdict.percent * 100).toFixed(0)}%)`
            : `They're ahead by ${Math.abs(verdict.diff).toFixed(1)} (${(verdict.percent * 100).toFixed(0)}%)`
        }
      >
        <span
          className="text-2xl leading-none sm:text-3xl"
          style={{
            color: textColor,
            WebkitTextStroke:
              verdict.winner === "fair" ? "none" : `2px ${borderColor}`,
            paintOrder: "stroke fill",
          }}
        >
          {symbol}
        </span>
      </div>
    </div>
  );
}

function TradePanel({
  title,
  variant,
  total,
  valuedRots,
  items,
  children,
}: {
  title: string;
  variant: "you" | "them";
  total: number;
  valuedRots: ValuedRot[];
  items: ValuedItem[];
  children: React.ReactNode;
}) {
  const bg = variant === "you" ? "#7cb3ff" : "#7ed957";
  const border = variant === "you" ? "#1e3a5f" : "#2e5a1f";
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col rounded-3xl p-3 sm:p-4"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      {/* Title bar - centered, large, outlined with a darker shade of the panel color */}
      <div className="mb-4 flex items-center justify-center py-1">
        <h2
          className="text-center text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            // Outline = darker shade of the container's blue/green
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {title} ({total.toFixed(0)})
        </h2>
      </div>

      {/* Slots grid - shared dark recessed background surrounding all slots */}
      <div
        className="grid grid-cols-4 gap-2 rounded-xl p-2 sm:gap-3 sm:p-3"
        style={{
          background: variant === "you" ? "#1e3a5f" : "#2e5a1f",
          boxShadow:
            "inset 0 2px 4px 0 rgba(0,0,0,0.45), inset 0 -1px 2px 0 rgba(255,255,255,0.1)",
        }}
      >
        {children}
      </div>

      {/* Value breakdown - collapsible, collapsed by default */}
      {(valuedRots.length > 0 || items.length > 0) && (
        <div className="mt-3">
          <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-[10px] uppercase text-white"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            <span>DETAILS</span>
            <span
              style={{
                transform: detailsOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
                display: "inline-block",
              }}
            >
              ▼
            </span>
          </button>
          {detailsOpen && (
            <div className="mt-1 max-h-44 overflow-y-auto rounded-xl bg-black/25 p-2 text-[10px] text-white/90">
              {valuedRots.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 border-b border-white/10 py-1"
                >
                  <span className="truncate">
                    {r.rot.Nickname || r.rot.Species}
                    <span className="ml-1 text-white/60">
                      L{r.rot.Level} · IV {(r.rot.IV * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span className="font-bold">{r.value.toFixed(1)}</span>
                </div>
              ))}
              {items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 border-b border-white/10 py-1"
                >
                  <span className="truncate">
                    {it.name}
                    <span className="ml-1 text-white/60">×{it.qty} ({it.tier})</span>
                  </span>
                  <span className="font-bold">{it.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Inventory Drawer
// ============================================================

function InventoryDrawer({
  side,
  data,
  rotsData,
  bagData,
  onClose,
  onAddRot,
  onAddItem,
  onAddCatalogRot,
  offerRots,
  offerItems,
}: {
  side: "you" | "them";
  data: PlayerData | null;
  rotsData: Record<string, Species>;
  bagData: Record<string, BagItemInfo>;
  onClose: () => void;
  onAddRot: (rot: Rot) => void;
  onAddItem: (name: string, qty: number) => void;
  onAddCatalogRot?: (speciesName: string) => void;
  offerRots: Rot[];
  offerItems: { name: string; qty: number }[];
}) {
  // Catalog mode = "them" side, no inventory data → show all species + all bag items
  const catalogMode = side === "them" && !data;
  const [tab, setTab] = useState<"team" | "pc" | "bag" | "rots" | "items">(
    catalogMode ? "rots" : "team"
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<
    "rarity-desc" | "rarity-asc" | "name-az" | "name-za"
  >("cab_sort_modal", "rarity-desc");
  const [tick, setTick] = useState<string | null>(null);

  const triggerTick = (id: string) => {
    setTick(null);
    requestAnimationFrame(() => setTick(id));
    setTimeout(() => setTick(null), 600);
  };

  const accent = side === "you" ? "#7cb3ff" : "#7ed957";
  const accentBorder = side === "you" ? "#1e3a5f" : "#2e5a1f";

  // ---- Sort helpers (shared) ----
  const sortRotsList = (arr: Rot[]) =>
    [...arr].sort((a, b) => {
      const spA = rotsData[a.Species];
      const spB = rotsData[b.Species];
      const rA = spA?.Rarity ?? 0;
      const rB = spB?.Rarity ?? 0;
      switch (sortBy) {
        case "rarity-asc":
          return rA - rB || (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "rarity-desc":
          return rB - rA || (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "name-az":
          return (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "name-za":
          return (b.Nickname || b.Species).localeCompare(a.Nickname || a.Species);
        default:
          return 0;
      }
    });

  // Group rots by rarity tier (for rarity sort) or first letter (for name sort)
  function groupRots<T extends Rot>(rots: T[]): { label: string; color?: string; items: T[] }[] {
    if (sortBy === "name-az" || sortBy === "name-za") {
      const sections: { label: string; items: T[] }[] = [];
      for (const rot of rots) {
        const name = rot.Nickname || rot.Species;
        const letter = (name[0] || "#").toUpperCase();
        const label = /[A-Z]/.test(letter) ? letter : "#";
        let section = sections.find((s) => s.label === label);
        if (!section) {
          section = { label, items: [] };
          sections.push(section);
        }
        section.items.push(rot);
      }
      return sections;
    }
    // rarity sort - group by tier
    const sections: { label: string; color: string; items: T[] }[] = [];
    for (const rot of rots) {
      const sp = rotsData[rot.Species];
      const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
      let section = sections.find((s) => s.label === tier.label);
      if (!section) {
        section = { label: tier.label, color: tier.color, items: [] };
        sections.push(section);
      }
      section.items.push(rot);
    }
    return sections;
  }

  // Group bag items by type (default) or first letter (name sort)
  function groupBag<T extends [string, number]>(entries: T[]): { label: string; items: T[] }[] {
    if (sortBy === "name-az" || sortBy === "name-za") {
      const sections: { label: string; items: T[] }[] = [];
      for (const entry of entries) {
        const letter = (entry[0][0] || "#").toUpperCase();
        const label = /[A-Z]/.test(letter) ? letter : "#";
        let section = sections.find((s) => s.label === label);
        if (!section) {
          section = { label, items: [] };
          sections.push(section);
        }
        section.items.push(entry);
      }
      return sections;
    }
    // type sort - group by tier
    const sections: { label: string; items: T[] }[] = [];
    for (const entry of entries) {
      const tier = classifyItem(entry[0]).tier;
      let section = sections.find((s) => s.label === tier);
      if (!section) {
        section = { label: tier, items: [] };
        sections.push(section);
      }
      section.items.push(entry);
    }
    return sections;
  }

  // ---- Catalog mode (them side, no inventory) ----
  if (catalogMode) {
    const allSpecies = Object.entries(rotsData);
    const allBag = Object.entries(bagData);
    const filteredSpecies = allSpecies
      .filter(([name, sp]) =>
        `${name} ${sp.ShortenedName} ${sp.FullName}`.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "rarity-asc":
            return a[1].Rarity - b[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
          case "rarity-desc":
            return b[1].Rarity - a[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
          case "name-az":
            return a[1].FullName.localeCompare(b[1].FullName);
          case "name-za":
            return b[1].FullName.localeCompare(a[1].FullName);
          default:
            return 0;
        }
      });
    const filteredBag = allBag
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "name-az") return a[0].localeCompare(b[0]);
        if (sortBy === "name-za") return b[0].localeCompare(a[0]);
        return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
      });

    return (
      <div
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
          style={{
            backgroundColor: "#1a1f2e",
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "40px 40px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "soft-light",
            boxShadow: `0 -4px 0 ${accentBorder}, inset 0 2px 0 rgba(255,255,255,0.1)`,
            border: `4px solid ${accentBorder}`,
          }}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
            style={{ background: accent, borderBottom: `3px solid ${accentBorder}` }}
          >
            <div>
              <h3
                className="text-outline text-sm text-white sm:text-base"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                THEIR ITEMS - CATALOG
              </h3>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white shadow-[0_3px_0_#7f1d1d]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Search + Sort row - fixed */}
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-white/10 px-4 py-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search..."
              className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            />
            <SortPill
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "rarity-desc", label: "Rarity ↓" },
                { value: "rarity-asc", label: "Rarity ↑" },
                { value: "name-az", label: "Name A-Z" },
                { value: "name-za", label: "Name Z-A" },
              ]}
            />
          </div>

          {/* Tab pills - fixed, styled like search bar */}
          <div className="flex shrink-0 flex-wrap justify-center gap-2 border-b border-white/10 px-4 py-2">
            {([
              { id: "rots", icon: "book-open", label: `ROTS (${allSpecies.length})` },
              { id: "items", icon: "fire", label: `ITEMS (${allBag.length})` },
            ] as const).map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="stud-input flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase transition-all"
                  style={{
                    color: isActive ? "#1e3a5f" : "#374151",
                    fontFamily: "var(--font-pixel), monospace",
                    borderRadius: "0.875rem",
                    background: isActive ? "rgba(124,179,255,0.6)" : undefined,
                  }}
                >
                  <PixelIcon
                    name={t.icon}
                    size={14}
                    color={isActive ? "#1e3a5f" : "#6b7280"}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* List - grid of slots with section dividers */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {tab === "items" ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {filteredBag.length === 0 ? (
                  <EmptyState text="No items match your search" />
                ) : (
                  groupBag(filteredBag).map((section) => (
                    <div key={section.label} className="contents">
                      <SectionDivider label={section.label} />
                      {section.items.map(([name, _qty]) => {
                        const info = bagData[name];
                        const tickId = "item-" + name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => { onAddItem(name, 1); triggerTick(tickId); }}
                            className="group relative aspect-square cursor-pointer"
                            style={{
                              background: "#374151",
                              borderRadius: "1.25rem",
                              boxShadow:
                                "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
                            }}
                            title={name}
                          >
                            <SmartImage
                              src={info?.Icon ? iconUrl(info.Icon) : ""}
                              alt={name}
                              imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                              fallbackSize={32}
                            />
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                              {name}
                            </div>
                            {/* Tick overlay on this slot */}
                            {tick === tickId && (
                              <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
                                <PixelIcon name="check" size={32} color="#ffffff" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {filteredSpecies.length === 0 ? (
                  <EmptyState text="No rots match your search" />
                ) : (
                  (() => {
                    // Group species by tier or letter
                    if (sortBy === "name-az" || sortBy === "name-za") {
                      const sections: { label: string; items: typeof filteredSpecies }[] = [];
                      for (const entry of filteredSpecies) {
                        const letter = (entry[1].FullName[0] || "#").toUpperCase();
                        const label = /[A-Z]/.test(letter) ? letter : "#";
                        let section = sections.find((s) => s.label === label);
                        if (!section) {
                          section = { label, items: [] };
                          sections.push(section);
                        }
                        section.items.push(entry);
                      }
                      return sections.map((section) => (
                        <div key={section.label} className="contents">
                          <SectionDivider label={section.label} />
                          {section.items.map(([name, sp]) => (
                            <CatalogRotSlot key={name} name={name} sp={sp} onAdd={onAddCatalogRot} onTick={triggerTick} isTicking={tick === "catalog-" + name} />
                          ))}
                        </div>
                      ));
                    }
                    // rarity sort
                    const sections: { label: string; color: string; items: typeof filteredSpecies }[] = [];
                    for (const entry of filteredSpecies) {
                      const tier = rarityTier(entry[1].Rarity, entry[1].IsExclusive);
                      let section = sections.find((s) => s.label === tier.label);
                      if (!section) {
                        section = { label: tier.label, color: tier.color, items: [] };
                        sections.push(section);
                      }
                      section.items.push(entry);
                    }
                    return sections.map((section) => (
                      <div key={section.label} className="contents">
                        <SectionDivider label={section.label} color={section.color} />
                        {section.items.map(([name, sp]) => (
                          <CatalogRotSlot key={name} name={name} sp={sp} onAdd={onAddCatalogRot} onTick={triggerTick} isTicking={tick === "catalog-" + name} />
                        ))}
                      </div>
                    ));
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Inventory mode (you side, real inventory) ----
  if (!data) return null;

  const allRots = [...data.Team, ...data.PC];
  const teamRots = sortRotsList(
    data.Team.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const pcRots = sortRotsList(
    data.PC.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const bagEntries = Object.entries(data.Bag)
    .filter(([name, q]) => q > 0 && name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name-az") return a[0].localeCompare(b[0]);
      if (sortBy === "name-za") return b[0].localeCompare(a[0]);
      return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
    });

  const isRotInOffer = (uid: string) =>
    offerRots.some((r) => r.UID === uid);
  const itemQtyInOffer = (name: string) =>
    offerItems.find((i) => i.name === name)?.qty ?? 0;

  const currentRots = tab === "team" ? teamRots : pcRots;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
        style={{
          backgroundColor: "#1a1f2e",
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "40px 40px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "soft-light",
          boxShadow: `0 -4px 0 ${accentBorder}, inset 0 2px 0 rgba(255,255,255,0.1)`,
          border: `4px solid ${accentBorder}`,
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
          style={{ background: accent, borderBottom: `3px solid ${accentBorder}` }}
        >
          <div>
            <h3
              className="text-outline text-sm text-white sm:text-base"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {side === "you" ? "YOUR" : "THEIR"} INVENTORY
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white shadow-[0_3px_0_#7f1d1d]"
            aria-label="Close inventory"
          >
            ✕
          </button>
        </div>

        {/* Search + Sort row - fixed */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-white/10 px-4 py-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search..."
            className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          />
          <SortPill
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "rarity-desc", label: "Rarity ↓" },
              { value: "rarity-asc", label: "Rarity ↑" },
              { value: "name-az", label: "Name A-Z" },
              { value: "name-za", label: "Name Z-A" },
            ]}
          />
        </div>

        {/* Tab pills - fixed, styled like search bar */}
        <div className="flex shrink-0 flex-wrap justify-center gap-2 border-b border-white/10 px-4 py-2">
          {([
            { id: "team", icon: "backpack", label: `TEAM (${teamRots.length})` },
            { id: "pc", icon: "book-open", label: `PC (${pcRots.length})` },
            { id: "bag", icon: "fire", label: `BAG (${bagEntries.length})` },
          ] as const).map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="stud-input flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase transition-all"
                style={{
                  color: isActive ? "#1e3a5f" : "#374151",
                  fontFamily: "var(--font-pixel), monospace",
                  borderRadius: "0.875rem",
                  background: isActive ? "rgba(124,179,255,0.6)" : undefined,
                }}
              >
                <PixelIcon
                  name={t.icon}
                  size={14}
                  color={isActive ? "#1e3a5f" : "#6b7280"}
                />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* List - grid of slots with section dividers */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {tab === "bag" ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {bagEntries.length === 0 ? (
                <EmptyState text="No bag items match your search" />
              ) : (
                groupBag(bagEntries).map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} />
                    {section.items.map(([name, qty]) => {
                      const inOffer = itemQtyInOffer(name);
                      const info = bagData[name];
                      const remaining = qty - inOffer;
                      const tickId = "invitem-" + name;
                      return (
                        <button
                          key={name}
                          type="button"
                          disabled={remaining <= 0}
                          onClick={() => { onAddItem(name, 1); triggerTick(tickId); }}
                          className="group relative aspect-square cursor-pointer disabled:opacity-40"
                          style={{
                            background: "#374151",
                            borderRadius: "1.25rem",
                            boxShadow:
                              "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
                          }}
                          title={`${name} ×${qty}`}
                        >
                          <SmartImage
                            src={info?.Icon ? iconUrl(info.Icon) : ""}
                            alt={name}
                            imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                            fallbackSize={32}
                          />
                          {qty > 1 && (
                            <span
                              className="text-outline-sm absolute bottom-0.5 right-0.5 text-xs text-white"
                              style={{
                                fontFamily: "var(--font-pixel), monospace",
                              }}
                            >
                              ×{qty}
                            </span>
                          )}
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                            {name}
                          </div>
                          {/* Tick overlay on this slot */}
                          {tick === tickId && (
                            <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
                              <PixelIcon name="check" size={32} color="#ffffff" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {currentRots.length === 0 ? (
                <EmptyState text={`No ${tab === "team" ? "team" : "PC"} rots match your search`} />
              ) : (
                groupRots(currentRots).map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} color={section.color} />
                    {section.items.map((rot) => {
                      const sp = rotsData[rot.Species];
                      const inOffer = isRotInOffer(rot.UID);
                      const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
                      const tickId = "rot-" + rot.UID;
                      return (
                        <button
                          key={rot.UID}
                          type="button"
                          disabled={inOffer}
                          onClick={() => { onAddRot(rot); triggerTick(tickId); }}
                          className={`group relative aspect-square cursor-pointer disabled:opacity-40 ${tier.shimmer ? "shimmer-rare" : ""}`}
                          style={{
                            background: tier.color,
                            borderRadius: "1.25rem",
                            boxShadow:
                              "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
                          }}
                          title={rot.Nickname || rot.Species}
                        >
                          <SmartImage
                            src={sp?.Icon ? iconUrl(sp.Icon) : ""}
                            alt={rot.Species}
                            imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                            fallbackSize={32}
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                            {rot.Nickname || rot.Species}
                          </div>
                          {/* Tick overlay on this slot */}
                          {tick === tickId && (
                            <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
                              <PixelIcon name="check" size={32} color="#ffffff" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Single catalog rot slot - used in catalog mode. */
function CatalogRotSlot({
  name,
  sp,
  onAdd,
  onTick,
  isTicking,
}: {
  name: string;
  sp: Species;
  onAdd?: (speciesName: string) => void;
  onTick?: (id: string) => void;
  isTicking?: boolean;
}) {
  const tier = rarityTier(sp.Rarity, sp.IsExclusive);
  return (
    <button
      type="button"
      onClick={() => { onAdd?.(name); onTick?.("catalog-" + name); }}
      className={`group relative aspect-square cursor-pointer ${tier.shimmer ? "shimmer-rare" : ""}`}
      style={{
        background: tier.color,
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
      }}
      title={sp.FullName}
    >
      <SmartImage
        src={sp.Icon ? iconUrl(sp.Icon) : ""}
        alt={sp.FullName}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {sp.ShortenedName}
      </div>
      {/* Tick overlay on this slot */}
      {isTicking && (
        <span className="tick-anim pointer-events-none absolute inset-0 z-40 grid place-items-center rounded-[1.25rem] bg-green-500/80">
          <PixelIcon name="check" size={32} color="#ffffff" />
        </span>
      )}
    </button>
  );
}


/** Brainrots page - grid of all species, color-coded by rarity tier, with shimmer for rare+. */
function BrainrotsView({
  rotsData,
}: {
  rotsData: Record<string, Species>;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"rarity-asc" | "rarity-desc" | "name-az" | "name-za">("cab_sort_rots", "rarity-desc");
  const species = Object.entries(rotsData);
  const filtered = species
    .filter(([name, sp]) =>
      `${name} ${sp.ShortenedName} ${sp.FullName}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rarity-asc":
          return a[1].Rarity - b[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
        case "rarity-desc":
          return b[1].Rarity - a[1].Rarity || a[1].FullName.localeCompare(b[1].FullName);
        case "name-az":
          return a[1].FullName.localeCompare(b[1].FullName);
        case "name-za":
          return b[1].FullName.localeCompare(a[1].FullName);
        default:
          return 0;
      }
    });

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      {/* Header - fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          BRAINROTS
        </h2>
      </div>

      {/* Search + Sort row - fixed */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search brainrots..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "rarity-desc", label: "Rarity ↓" },
            { value: "rarity-asc", label: "Rarity ↑" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      {/* Scrollable content - grid + legend */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
          {(() => {
            if (filtered.length === 0) {
              return <EmptyState text="No brainrots match your search" />;
            }
            // When sorted by rarity, group by tier with section dividers
            if (sortBy === "rarity-asc" || sortBy === "rarity-desc") {
              const sections: { label: string; color: string; items: typeof filtered }[] = [];
              for (const [name, sp] of filtered) {
                const tier = rarityTier(sp.Rarity, sp.IsExclusive);
                let section = sections.find((s) => s.label === tier.label);
                if (!section) {
                  section = { label: tier.label, color: tier.color, items: [] };
                  sections.push(section);
                }
                section.items.push([name, sp]);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} color={section.color} />
                  {section.items.map(([name, sp]) => (
                    <BrainrotSlot key={name} name={name} sp={sp} />
                  ))}
                </div>
              ));
            }
            // When sorted by name, group by first letter with section dividers
            if (sortBy === "name-az" || sortBy === "name-za") {
              const sections: { label: string; items: typeof filtered }[] = [];
              for (const [name, sp] of filtered) {
                const letter = (sp.FullName[0] || "#").toUpperCase();
                const label = /[A-Z]/.test(letter) ? letter : "#";
                let section = sections.find((s) => s.label === label);
                if (!section) {
                  section = { label, items: [] };
                  sections.push(section);
                }
                section.items.push([name, sp]);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} />
                  {section.items.map(([name, sp]) => (
                    <BrainrotSlot key={name} name={name} sp={sp} />
                  ))}
                </div>
              ));
            }
            // Otherwise just render flat
            return filtered.map(([name, sp]) => (
              <BrainrotSlot key={name} name={name} sp={sp} />
            ));
          })()}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[9px] text-white/80">
          <LegendChip color="#c62828" label="Common" />
          <LegendChip color="#fca5a5" label="Uncommon" />
          <LegendChip color="#e5e7eb" label="Rare" />
          <LegendChip color="#a3e635" label="Epic" />
          <LegendChip color="#fbbf24" label="Legendary" />
          <LegendChip color="#7f1d1d" label="Demon" />
        </div>
      </div>
    </div>
  );
}

/** Single brainrot slot - extracted for reuse. */
function BrainrotSlot({ name, sp }: { name: string; sp: Species }) {
  const tier = rarityTier(sp.Rarity, sp.IsExclusive);
  return (
    <div
      className={`group relative aspect-square cursor-help ${tier.shimmer ? "shimmer-rare" : ""}`}
      style={{
        background: tier.color,
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
      }}
      title={`${sp.FullName} · Rarity ${sp.Rarity.toFixed(2)}${sp.IsExclusive ? " · DEMON" : ""}${sp.SpawnLocation ? ` · W${sp.SpawnLocation.World}Z${sp.SpawnLocation.Zone}` : ""}`}
    >
      <SmartImage
        src={iconUrl(sp.Icon)}
        alt={sp.FullName}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {sp.ShortenedName} · R{sp.Rarity.toFixed(1)}
      </div>
    </div>
  );
}


/** Rarity tier → { color, shimmer, label } for slot backgrounds.
 *  Only legendary (rarity >= 5) and demon get the shimmer effect. */
function rarityTier(rarity: number, isExclusive: boolean): { color: string; shimmer: boolean; label: string } {
  if (isExclusive) return { color: "#7f1d1d", shimmer: true, label: "Demon" }; // demon
  if (rarity >= 5) return { color: "#fbbf24", shimmer: true, label: "Legendary" }; // legendary
  if (rarity >= 4) return { color: "#a3e635", shimmer: false, label: "Epic" }; // epic
  if (rarity >= 3) return { color: "#e5e7eb", shimmer: false, label: "Rare" }; // rare
  if (rarity >= 2) return { color: "#fca5a5", shimmer: false, label: "Uncommon" }; // uncommon
  return { color: "#c62828", shimmer: false, label: "Common" }; // common
}

/** Rarity tier → background color for slot tiles. */
function rarityTierColor(rarity: number, isExclusive: boolean): string {
  return rarityTier(rarity, isExclusive).color;
}

/** Section divider - a large titled header that separates groups when sorted. */
function SectionDivider({ label }: { label: string; color?: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 py-3">
      <h3
        className="text-outline text-lg text-white sm:text-2xl"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {label}
      </h3>
      <div className="h-1 flex-1 rounded-full bg-white" />
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="inline-block h-3 w-3 rounded"
        style={{ background: color }}
      />
      <span style={{ fontFamily: "var(--font-pixel), monospace" }}>{label}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full grid place-items-center py-10 text-center">
      <div className="text-3xl opacity-40">📦</div>
      <p className="mt-2 text-xs text-white/50">{text}</p>
    </div>
  );
}

/** Items page - grid of all bag items. */
function ItemsView({
  bagData,
}: {
  bagData: Record<string, BagItemInfo>;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"type" | "name-az" | "name-za">("cab_sort_items", "name-za");
  const items = Object.entries(bagData);
  const filtered = items
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "type": {
          const ta = classifyItem(a[0]).tier;
          const tb = classifyItem(b[0]).tier;
          return ta.localeCompare(tb) || a[0].localeCompare(b[0]);
        }
        case "name-az":
          return a[0].localeCompare(b[0]);
        case "name-za":
          return b[0].localeCompare(a[0]);
        default:
          return 0;
      }
    });

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      {/* Header - fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          ITEMS
        </h2>
      </div>

      {/* Search + Sort row - fixed */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search items..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "type", label: "Type" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      {/* Scrollable content - grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
          {(() => {
            if (filtered.length === 0) {
              return <EmptyState text="No items match your search" />;
            }
            // When sorted by type, group by tier with section dividers
            if (sortBy === "type") {
              const sections: { label: string; items: typeof filtered }[] = [];
              for (const entry of filtered) {
                const tier = classifyItem(entry[0]).tier;
                let section = sections.find((s) => s.label === tier);
                if (!section) {
                  section = { label: tier, items: [] };
                  sections.push(section);
                }
                section.items.push(entry);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} />
                  {section.items.map(([name, info]) => (
                    <ItemSlot key={name} name={name} info={info} />
                  ))}
                </div>
              ));
            }
            // When sorted by name, group by first letter with section dividers
            if (sortBy === "name-az" || sortBy === "name-za") {
              const sections: { label: string; items: typeof filtered }[] = [];
              for (const entry of filtered) {
                const letter = (entry[0][0] || "#").toUpperCase();
                const label = /[A-Z]/.test(letter) ? letter : "#";
                let section = sections.find((s) => s.label === label);
                if (!section) {
                  section = { label, items: [] };
                  sections.push(section);
                }
                section.items.push(entry);
              }
              return sections.map((section) => (
                <div key={section.label} className="contents">
                  <SectionDivider label={section.label} />
                  {section.items.map(([name, info]) => (
                    <ItemSlot key={name} name={name} info={info} />
                  ))}
                </div>
              ));
            }
            // Otherwise just render flat
            return filtered.map(([name, info]) => (
              <ItemSlot key={name} name={name} info={info} />
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

/** Single item slot - extracted for reuse. */
function ItemSlot({ name, info }: { name: string; info: BagItemInfo }) {
  return (
    <div
      className="group relative aspect-square cursor-help"
      style={{
        background: "#374151",
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
      }}
      title={`${name} - ${info.Description}`}
    >
      <SmartImage
        src={iconUrl(info.Icon)}
        alt={name}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {name}
      </div>
    </div>
  );
}

/** Inventory page - shows the player's loaded inventory (team, PC, bag). */
function InventoryView({
  youProfile,
  yourData,
  rotsData,
  bagData,
  loading,
}: {
  youProfile: { id: string; displayName: string; avatarUrl?: string } | null;
  yourData: PlayerData | null;
  rotsData: Record<string, Species>;
  bagData: Record<string, BagItemInfo>;
  loading: boolean;
}) {
  const [tab, setTab] = useState<"team" | "pc" | "bag">("team");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = usePersistentState<"rarity-asc" | "rarity-desc" | "name-az" | "name-za" | "level-asc" | "level-desc">("cab_sort_inventory", "rarity-desc");
  const [detailRot, setDetailRot] = useState<Rot | null>(null);
  const [detailBag, setDetailBag] = useState<{ name: string; info: BagItemInfo; qty: number } | null>(null);

  if (!youProfile) {
    return (
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          COMPLETE ONBOARDING FIRST
        </p>
      </div>
    );
  }

  if (loading && !yourData) {
    return (
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-outline text-base text-white" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          LOADING INVENTORY...
        </p>
      </div>
    );
  }

  if (!yourData) {
    return (
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
        <p
          className="text-outline mb-3 text-base text-white"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          NO INVENTORY FOUND
        </p>
        <p className="mx-auto max-w-md text-[10px] text-white/70">
          Your Roblox account doesn&apos;t have a Catch a Brainrot save yet.
          Play the game and come back, or use the catalog picker on the trade view.
        </p>
      </div>
    );
  }

  const sortRots = (arr: Rot[]) =>
    [...arr].sort((a, b) => {
      const spA = rotsData[a.Species];
      const spB = rotsData[b.Species];
      const rA = spA?.Rarity ?? 0;
      const rB = spB?.Rarity ?? 0;
      switch (sortBy) {
        case "rarity-asc":
          return rA - rB || (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "rarity-desc":
          return rB - rA || (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "name-az":
          return (a.Nickname || a.Species).localeCompare(b.Nickname || b.Species);
        case "name-za":
          return (b.Nickname || b.Species).localeCompare(a.Nickname || a.Species);
        case "level-asc":
          return a.Level - b.Level;
        case "level-desc":
          return b.Level - a.Level;
        default:
          return 0;
      }
    });

  const teamRots = sortRots(
    yourData.Team.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const pcRots = sortRots(
    yourData.PC.filter((r) =>
      `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
    )
  );
  const bagEntries = Object.entries(yourData.Bag)
    .filter(([name, q]) => q > 0 && name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name-az") return a[0].localeCompare(b[0]);
      if (sortBy === "name-za") return b[0].localeCompare(a[0]);
      // default: type (covers rarity-asc, rarity-desc, level-* which aren't offered for bag)
      return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
    });
  const currentRots = tab === "team" ? teamRots : pcRots;

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      {/* Header - fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          INVENTORY
        </h2>
      </div>

      {/* Search - fixed */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search inventory..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
        <SortPill
          value={sortBy}
          onChange={setSortBy}
          options={
            tab === "bag"
              ? [
                  { value: "rarity-asc", label: "Type" },
                  { value: "name-az", label: "Name A-Z" },
                  { value: "name-za", label: "Name Z-A" },
                ]
              : [
                  { value: "rarity-asc", label: "Rarity ↑" },
                  { value: "rarity-desc", label: "Rarity ↓" },
                  { value: "name-az", label: "Name A-Z" },
                  { value: "name-za", label: "Name Z-A" },
                  { value: "level-asc", label: "Level ↑" },
                  { value: "level-desc", label: "Level ↓" },
                ]
          }
        />
      </div>

      {/* Tab pills - fixed */}
      <div className="mb-4 flex shrink-0 flex-wrap justify-center gap-2">
        {([
          { id: "team", icon: "backpack", label: `TEAM (${teamRots.length})` },
          { id: "pc", icon: "book-open", label: `PC (${pcRots.length})` },
          { id: "bag", icon: "fire", label: `BAG (${bagEntries.length})` },
        ] as const).map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="stud-input flex items-center gap-2 px-3 py-2 text-[10px] uppercase transition-all"
              style={{
                color: isActive ? "#1e3a5f" : "#374151",
                fontFamily: "var(--font-pixel), monospace",
                borderRadius: "0.875rem",
                background: isActive
                  ? "rgba(124,179,255,0.6)"
                  : undefined,
              }}
            >
              <PixelIcon
                name={t.icon}
                size={16}
                color={isActive ? "#1e3a5f" : "#6b7280"}
              />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content - slots float on page bg */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {tab === "bag" ? (
          <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
            {(() => {
              if (bagEntries.length === 0) {
                return <EmptyState text="No bag items" />;
              }
              // When sorted by type (default + any rarity/level sort), group by tier
              if (sortBy !== "name-az" && sortBy !== "name-za") {
                const sections: { label: string; items: typeof bagEntries }[] = [];
                for (const entry of bagEntries) {
                  const tier = classifyItem(entry[0]).tier;
                  let section = sections.find((s) => s.label === tier);
                  if (!section) {
                    section = { label: tier, items: [] };
                    sections.push(section);
                  }
                  section.items.push(entry);
                }
                return sections.map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} />
                    {section.items.map(([name, qty]) => (
                      <InventoryBagSlot key={name} name={name} qty={qty} info={bagData[name]} onClick={() => setDetailBag({ name, info: bagData[name], qty })} />
                    ))}
                  </div>
                ));
              }
              // When sorted by name, group by first letter
              if (sortBy === "name-az" || sortBy === "name-za") {
                const sections: { label: string; items: typeof bagEntries }[] = [];
                for (const entry of bagEntries) {
                  const letter = (entry[0][0] || "#").toUpperCase();
                  const label = /[A-Z]/.test(letter) ? letter : "#";
                  let section = sections.find((s) => s.label === label);
                  if (!section) {
                    section = { label, items: [] };
                    sections.push(section);
                  }
                  section.items.push(entry);
                }
                return sections.map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} />
                    {section.items.map(([name, qty]) => (
                      <InventoryBagSlot key={name} name={name} qty={qty} info={bagData[name]} onClick={() => setDetailBag({ name, info: bagData[name], qty })} />
                    ))}
                  </div>
                ));
              }
              return bagEntries.map(([name, qty]) => (
                <InventoryBagSlot key={name} name={name} qty={qty} info={bagData[name]} onClick={() => setDetailBag({ name, info: bagData[name], qty })} />
              ));
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 p-1 sm:grid-cols-6 md:grid-cols-8 sm:p-2">
            {(() => {
              if (currentRots.length === 0) {
                return <EmptyState text={`No ${tab === "team" ? "team" : "PC"} rots`} />;
              }
              // When sorted by rarity, group by tier with section dividers
              if (sortBy === "rarity-asc" || sortBy === "rarity-desc") {
                const sections: { label: string; color: string; items: Rot[] }[] = [];
                for (const rot of currentRots) {
                  const sp = rotsData[rot.Species];
                  const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
                  let section = sections.find((s) => s.label === tier.label);
                  if (!section) {
                    section = { label: tier.label, color: tier.color, items: [] };
                    sections.push(section);
                  }
                  section.items.push(rot);
                }
                return sections.map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} color={section.color} />
                    {section.items.map((rot) => (
                      <InventoryRotSlot key={rot.UID} rot={rot} sp={rotsData[rot.Species]} onClick={() => setDetailRot(rot)} />
                    ))}
                  </div>
                ));
              }
              // When sorted by name, group by first letter
              if (sortBy === "name-az" || sortBy === "name-za") {
                const sections: { label: string; items: Rot[] }[] = [];
                for (const rot of currentRots) {
                  const name = rot.Nickname || rot.Species;
                  const letter = (name[0] || "#").toUpperCase();
                  const label = /[A-Z]/.test(letter) ? letter : "#";
                  let section = sections.find((s) => s.label === label);
                  if (!section) {
                    section = { label, items: [] };
                    sections.push(section);
                  }
                  section.items.push(rot);
                }
                return sections.map((section) => (
                  <div key={section.label} className="contents">
                    <SectionDivider label={section.label} />
                    {section.items.map((rot) => (
                      <InventoryRotSlot key={rot.UID} rot={rot} sp={rotsData[rot.Species]} onClick={() => setDetailRot(rot)} />
                    ))}
                  </div>
                ));
              }
              return currentRots.map((rot) => (
                <InventoryRotSlot key={rot.UID} rot={rot} sp={rotsData[rot.Species]} onClick={() => setDetailRot(rot)} />
              ));
            })()}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {(detailRot || detailBag) && (
        <ItemDetailModal
          rot={detailRot ?? undefined}
          species={detailRot ? rotsData[detailRot.Species] : undefined}
          bagItem={detailBag ?? undefined}
          onClose={() => {
            setDetailRot(null);
            setDetailBag(null);
          }}
        />
      )}
    </div>
  );
}

/** Single inventory rot slot - extracted for reuse. */
function InventoryRotSlot({
  rot,
  sp,
  onClick,
}: {
  rot: Rot;
  sp?: Species;
  onClick?: () => void;
}) {
  const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-square cursor-pointer ${tier.shimmer ? "shimmer-rare" : ""}`}
      style={{
        background: tier.color,
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
      }}
      title={`${rot.Nickname || rot.Species}`}
    >
      <SmartImage
        src={sp?.Icon ? iconUrl(sp.Icon) : ""}
        alt={rot.Species}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {rot.Nickname || rot.Species}
      </div>
    </button>
  );
}

/** Single inventory bag slot - extracted for reuse. */
function InventoryBagSlot({
  name,
  qty,
  info,
  onClick,
}: {
  name: string;
  qty: number;
  info?: BagItemInfo;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square cursor-pointer"
      style={{
        background: "#374151",
        borderRadius: "1.25rem",
        boxShadow:
          "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
      }}
      title={`${name} ×${qty}`}
    >
      <SmartImage
        src={info?.Icon ? iconUrl(info.Icon) : ""}
        alt={name}
        imgClassName="h-full w-full object-contain p-1 [image-rendering:pixelated]"
        fallbackSize={32}
      />
      {qty > 1 && (
        <span
          className="text-outline-sm absolute bottom-0.5 right-0.5 text-xs text-white"
          style={{
            fontFamily: "var(--font-pixel), monospace",
          }}
        >
          ×{qty}
        </span>
      )}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
        {name}
      </div>
    </button>
  );
}

/** Placeholder view for not-yet-built pages. */
/** Values page - shows value tiers for all brainrots and items. */
function ValuesView({
  rotsData,
  bagData,
}: {
  rotsData: Record<string, Species>;
  bagData: Record<string, BagItemInfo>;
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"rots" | "items">("rots");

  // Compute values for all rots (base value at L1, IV 0.5)
  const rotValues = Object.entries(rotsData)
    .map(([name, sp]) => {
      const base = sp.Rarity * 10;
      const ivMult = 0.6 + 0.5 * 0.8; // IV 0.5
      const value = base * ivMult * (sp.IsExclusive ? 1.5 : 1);
      return { name, sp, value, tier: rarityTier(sp.Rarity, sp.IsExclusive) };
    })
    .filter((r) =>
      `${r.name} ${r.sp.ShortenedName} ${r.sp.FullName}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.value - a.value);

  // Compute values for all items
  const itemValues = Object.entries(bagData)
    .map(([name, info]) => {
      const { tier, value } = classifyItem(name);
      return { name, info, value, tier };
    })
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      {/* Header - fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          VALUES
        </h2>
      </div>

      {/* Search - fixed */}
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search values..."
          className="stud-input h-9 max-w-md text-sm text-gray-900"
          style={{
            borderRadius: "0.875rem",
            fontFamily: "var(--font-pixel), monospace",
          }}
        />
      </div>

      {/* Tab pills - fixed */}
      <div className="mb-4 flex shrink-0 flex-wrap justify-center gap-2">
        {([
          { id: "rots", icon: "book-open", label: `ROTS (${rotValues.length})` },
          { id: "items", icon: "fire", label: `ITEMS (${itemValues.length})` },
        ] as const).map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="stud-input flex items-center gap-2 px-3 py-2 text-[10px] uppercase transition-all"
              style={{
                color: isActive ? "#1e3a5f" : "#374151",
                fontFamily: "var(--font-pixel), monospace",
                borderRadius: "0.875rem",
                background: isActive ? "rgba(124,179,255,0.6)" : undefined,
              }}
            >
              <PixelIcon
                name={t.icon}
                size={16}
                color={isActive ? "#1e3a5f" : "#6b7280"}
              />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {tab === "rots" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rotValues.length === 0 ? (
              <EmptyState text="No rots match your search" />
            ) : (
              rotValues.map(({ name, sp, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: `2px solid ${tier.color}60`,
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={sp.Icon ? iconUrl(sp.Icon) : ""}
                      alt={sp.FullName}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {sp.FullName}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier.label} · R{sp.Rarity.toFixed(2)}
                    </div>
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {itemValues.length === 0 ? (
              <EmptyState text="No items match your search" />
            ) : (
              itemValues.map(({ name, info, value, tier }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl p-2"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backgroundImage: "url('/stud_texture.png')",
                    backgroundSize: "30px 30px",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "multiply",
                    border: "2px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                    <SmartImage
                      src={info.Icon ? iconUrl(info.Icon) : ""}
                      alt={name}
                      fill={false}
                      fallbackSize={32}
                      imgClassName="object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {name}
                    </div>
                    <div
                      className="truncate text-[10px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier}
                    </div>
                  </div>
                  <span
                    className="text-outline-sm-white text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {value.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Settings page - account + preferences, some greyed out as "coming soon". */
function SettingsView({
  profile,
  onLogout,
}: {
  profile: { id: string; displayName: string; avatarUrl?: string } | null;
  onLogout: () => void;
}) {
  const [cacheCleared, setCacheCleared] = useState(false);

  // White/off-white container with stud texture - matches site style
  const containerStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.92)",
    backgroundImage: "url('/stud_texture.png')",
    backgroundSize: "30px 30px",
    backgroundRepeat: "repeat",
    backgroundBlendMode: "multiply",
    border: "2px solid rgba(0,0,0,0.15)",
    borderRadius: "0.875rem",
  };

  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("cab_")
      );
      keys.forEach((k) => {
        if (k !== "cab_profile") localStorage.removeItem(k);
      });
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      {/* Header - fixed */}
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            SETTINGS
          </h2>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
        {/* Account section */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            ACCOUNT
          </h3>
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-12 w-12 rounded-lg object-cover [image-rendering:pixelated]"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-gray-200">
                <PixelIcon name="info-box" size={24} color="#6b7280" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">
                {profile?.displayName ?? "Not logged in"}
              </div>
              <div className="truncate text-xs text-gray-600">
                {profile ? `ID: ${profile.id}` : ""}
              </div>
            </div>
            {profile && (
              <button
                onClick={onLogout}
                className="rounded-lg bg-red-500 px-3 py-2 text-[9px] uppercase text-white transition-transform active:translate-y-0.5"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  boxShadow: "0 2px 0 #7f1d1d",
                }}
              >
                LOGOUT
              </button>
            )}
          </div>
        </div>

        {/* Preferences section */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            PREFERENCES
          </h3>

          {/* Working setting: Clear cache */}
          <button
            onClick={clearCache}
            className="mb-2 flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:bg-blue-50"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            <span
              className="text-sm font-semibold text-gray-900"
            >
              {cacheCleared ? "✓ CACHE CLEARED!" : "CLEAR CACHE"}
            </span>
            <PixelIcon name="switch" size={18} color="#6b7280" />
          </button>

          {/* Coming soon settings */}
          <ComingSoonSetting label="THEME" />
          <ComingSoonSetting label="NOTIFICATIONS" />
          <ComingSoonSetting label="TRADE ALERTS" />
          <ComingSoonSetting label="DEFAULT SORT" />
          <ComingSoonSetting label="LANGUAGE" />
        </div>
        </div>
      </div>
    </div>
  );
}

/** A settings row that's greyed out with "COMING SOON" overlay. */
function ComingSoonSetting({
  label,
}: {
  label: string;
}) {
  return (
    <div
      className="relative mb-2 flex items-center justify-between overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 p-3"
    >
      <span
        className="text-sm font-semibold text-gray-500"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {label}
      </span>
      <PixelIcon name="switch" size={18} color="#9ca3af" />
      {/* Coming soon overlay */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gray-100/80">
        <span
          className="rounded-md bg-gray-300 px-2 py-0.5 text-[8px] uppercase text-gray-600"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          COMING SOON
        </span>
      </div>
    </div>
  );
}

/** Account Switch Modal - asks user if they want to change accounts */
function AccountSwitchModal({
  open,
  onClose,
  onConfirm,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: { id: string; displayName: string; avatarUrl?: string } | null;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border-4 border-black/50 bg-white/95 p-6 shadow-2xl"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "30px 30px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "multiply",
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, #7cb3ff, #60a5fa)",
              border: "3px solid #1e3a5f",
              boxShadow: "0 3px 0 0 #1e3a5f",
            }}
          >
            <span className="text-xl">👤</span>
          </div>
          <div className="flex flex-col">
            <h3
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              SWITCH ACCOUNT
            </h3>
            <p className="text-xs text-gray-600">
              Currently logged in as:
            </p>
          </div>
        </div>

        {/* Current profile display */}
        <div
          className="mb-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-3"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "20px 20px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-10 w-10 rounded-lg object-cover [image-rendering:pixelated]"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-200">
                <span className="text-xs">👤</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-sm font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {profile?.displayName ?? "Unknown"}
              </div>
              <div className="truncate text-xs text-gray-600">
                ID: {profile?.id}
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <p
          className="mb-4 text-sm text-gray-700"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          Do you want to switch to a different account?
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-300"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              border: "2px solid #9ca3af",
              boxShadow: "0 3px 0 0 #6b7280",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              border: "2px solid #7f1d1d",
              boxShadow: "0 3px 0 0 #7f1d1d",
            }}
          >
            YES, SWITCH
          </button>
        </div>
      </div>
    </div>
  );
}

/** News / Announcement page - displays official announcements */
function NewsView() {
  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      {/* Header - fixed */}
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            NEWS & ANNOUNCEMENTS
          </h2>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
        {/* Announcement Banner - styled to match the site */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-6 shadow-lg"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          {/* Announcement header */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                border: "3px solid #1e3a5f",
                boxShadow: "0 3px 0 0 #1e3a5f",
              }}
            >
              <span className="text-2xl">📢</span>
            </div>
            <div className="flex flex-col">
              <span
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                OFFICIAL ANNOUNCEMENT
              </span>
              <span className="text-xs text-gray-600">
                Posted in #announcements
              </span>
            </div>
          </div>

          {/* Message content */}
          <div className="space-y-4">
            {/* Main heading */}
            <h3
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Trading calculator, values list, inventory viewer & more
            </h3>

            {/* Intro paragraph */}
            <p className="text-sm text-gray-700">
              Hey everyone, I have developed a server official{" "}
              <a
                href="https://cab.devvyy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-700"
              >
                catch a brainrot calculator site
              </a>
              . You can find the site here:{" "}
              <a
                href="https://cab.devvyy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-700"
              >
                https://cab.devvyy.xyz/
              </a>
            </p>

            {/* Features section */}
            <div>
              <h4
                className="mb-2 text-base font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                Features
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm text-gray-700">
                <li>Trade calculator</li>
                <li>Inventory viewer</li>
                <li>
                  Rot, item, and egg database overview viewer of all in-game
                  (including unreleased)
                </li>
                <li>Values list</li>
                <li className="italic text-gray-500">much more to be added soon</li>
              </ul>
            </div>

            {/* To be added section */}
            <div>
              <h4
                className="mb-2 text-base font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                To be added
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm text-gray-700">
                <li>Roblox login</li>
                <li>Trade sharing (for W/L sharing)</li>
                <li>
                  Updated values to be more accurate with in-game trades and
                  demand
                </li>
                <li>Demand indicators</li>
                <li>Recent trades page</li>
                <li>Brainrot IV comparison</li>
                <li>Team building</li>
                <li>
                  Player info page (for viewing other players stats and
                  inventories)
                </li>
                <li>Notifications</li>
                <li>Damage calculator</li>
                <li>Tier list creator/sharing</li>
              </ul>
            </div>

            {/* Footer note */}
            <div className="border-t-2 border-gray-300 pt-3">
              <p className="text-xs text-gray-600 italic">
                The site has just been released, trading values and stats will
                be updated the more use it gets and when in-game trading database
                connection is possible.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

/** About / Info page - simple, with stats visualizations. */
function AboutView({
  rotsData,
  bagData,
  yourData,
}: {
  rotsData: Record<string, Species>;
  bagData: Record<string, BagItemInfo>;
  yourData: PlayerData | null;
}) {
  const totalSpecies = Object.keys(rotsData).length;
  const ownedSpecies = yourData
    ? new Set([...yourData.Team, ...yourData.PC].map((r) => r.Species)).size
    : 0;
  const totalRots = yourData ? yourData.Team.length + yourData.PC.length : 0;
  const bagTypes = yourData
    ? Object.values(yourData.Bag).filter((q) => q > 0).length
    : 0;
  const totalBagItems = yourData
    ? Object.values(yourData.Bag).reduce((s, q) => s + q, 0)
    : 0;

  // Rarity distribution for pie/bar chart
  const rarityDist = Object.values(rotsData).reduce(
    (acc, sp) => {
      const tier = rarityTier(sp.Rarity, sp.IsExclusive).label;
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const rarityEntries = Object.entries(rarityDist).sort((a, b) => b[1] - a[1]);
  const maxRarityCount = Math.max(...rarityEntries.map(([, c]) => c), 1);

  // Owned rarity distribution
  const ownedRarity = yourData
    ? [...yourData.Team, ...yourData.PC].reduce(
        (acc, rot) => {
          const sp = rotsData[rot.Species];
          if (sp) {
            const tier = rarityTier(sp.Rarity, sp.IsExclusive).label;
            acc[tier] = (acc[tier] ?? 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  const rarityColors: Record<string, string> = {
    Common: "#c62828",
    Uncommon: "#fca5a5",
    Rare: "#e5e7eb",
    Epic: "#a3e635",
    Legendary: "#fbbf24",
    Demon: "#7f1d1d",
  };

  // Item type distribution for bar chart
  const itemTypes = Object.entries(
    Object.keys(bagData).reduce(
      (acc, name) => {
        const tier = classifyItem(name).tier;
        acc[tier] = (acc[tier] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).sort((a, b) => b[1] - a[1]);
  const maxItemTypeCount = Math.max(...itemTypes.map(([, c]) => c), 1);

  // Collection completion percentage
  const completionPct = totalSpecies > 0 ? (ownedSpecies / totalSpecies) * 100 : 0;

  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      {/* Header - fixed */}
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <Image
            src="/cab_icon.png"
            alt="CAB"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-2xl object-cover [image-rendering:pixelated]"
          />
          <h2
            className="text-outline text-center text-xl text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            ABOUT & STATS
          </h2>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
        {/* Announcement Banner */}
        <div className="mb-6 rounded-xl border border-white/10 bg-[#313338] p-4 shadow-lg">
          {/* Author header */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
              <span className="text-lg">📢</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Official Announcement</span>
              <span className="text-xs text-gray-400">Posted in #announcements</span>
            </div>
          </div>

          {/* Message content */}
          <div className="space-y-3 text-sm text-gray-200">
            {/* Main heading */}
            <h3
              className="text-lg font-bold text-white"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Trading calculator, values list, inventory viewer & more
            </h3>

            {/* Intro paragraph */}
            <p className="text-gray-300">
              Hey everyone, I have developed a server official{" "}
              <a
                href="https://cab.devvyy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                catch a brainrot calculator site
              </a>
              . You can find the site here:{" "}
              <a
                href="https://cab.devvyy.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                https://cab.devvyy.xyz/
              </a>
            </p>

            {/* Features section */}
            <div>
              <h4
                className="mb-2 text-base font-semibold text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                Features
              </h4>
              <ul className="ml-4 list-disc space-y-1 text-gray-300">
                <li>Trade calculator</li>
                <li>Inventory viewer</li>
                <li>
                  Rot, item, and egg database overview viewer of all in-game
                  (including unreleased)
                </li>
                <li>Values list</li>
                <li className="italic text-gray-400">much more to be added soon</li>
              </ul>
            </div>

            {/* To be added section */}
            <div>
              <h4
                className="mb-2 text-base font-semibold text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                To be added
              </h4>
              <ul className="ml-4 list-disc space-y-1 text-gray-300">
                <li>Roblox login</li>
                <li>Trade sharing (for W/L sharing)</li>
                <li>
                  Updated values to be more accurate with in-game trades and
                  demand
                </li>
                <li>Demand indicators</li>
                <li>Recent trades page</li>
                <li>Brainrot IV comparison</li>
                <li>Team building</li>
                <li>
                  Player info page (for viewing other players stats and
                  inventories)
                </li>
                <li>Notifications</li>
                <li>Damage calculator</li>
                <li>Tier list creator/sharing</li>
              </ul>
            </div>

            {/* Footer note */}
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-gray-500 italic">
                The site has just been released, trading values and stats will
                be updated the more use it gets and when in-game trading database
                connection is possible.
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Collection progress bar */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            COLLECTION PROGRESS
          </h3>
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-outline-sm text-[10px] text-gray-700"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {ownedSpecies}/{totalSpecies} SPECIES
            </span>
            <span
              className="text-outline-sm text-[10px] font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {completionPct.toFixed(0)}%
            </span>
          </div>
          <div className="h-6 overflow-hidden rounded-lg bg-gray-200">
            <div
              className="grid h-full place-items-center rounded-lg"
              style={{
                width: `${Math.max(completionPct, 2)}%`,
                background: "linear-gradient(180deg, #4ade80, #16a34a)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                transition: "width 0.3s",
              }}
            >
              <span
                className="text-[8px] font-bold text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {completionPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats - list style */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            YOUR STATS
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { label: "Rots Owned", value: totalRots },
              { label: "Unique Species", value: ownedSpecies },
              { label: "Bag Types", value: bagTypes },
              { label: "Total Bag Items", value: totalBagItems },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b border-gray-200 py-2 last:border-0"
              >
                <span
                  className="text-xs text-gray-700"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {stat.label}
                </span>
                <span
                  className="text-outline-sm-white text-sm font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rarity distribution - bar chart */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            RARITY DISTRIBUTION
          </h3>
          <div className="flex flex-col gap-2">
            {rarityEntries.map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2">
                <span
                  className="w-16 shrink-0 text-[8px] font-semibold text-gray-700"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {tier.toUpperCase()}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(count / maxRarityCount) * 100}%`,
                      background: rarityColors[tier] ?? "#6b7280",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
                <span
                  className="w-6 shrink-0 text-right text-[8px] font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Owned vs total - pie-style (donut) */}
        {yourData && (
          <div
            className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
            style={{
              backgroundImage: "url('/stud_texture.png')",
              backgroundSize: "30px 30px",
              backgroundRepeat: "repeat",
              backgroundBlendMode: "multiply",
            }}
          >
            <h3
              className="text-outline mb-3 text-sm text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              OWNED BY RARITY
            </h3>
            <div className="flex flex-wrap gap-2">
              {rarityEntries.map(([tier, _]) => {
                const owned = ownedRarity[tier] ?? 0;
                const total = rarityDist[tier] ?? 0;
                const pct = total > 0 ? (owned / total) * 100 : 0;
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1.5"
                    style={{ border: `1px solid ${rarityColors[tier]}40` }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: rarityColors[tier] }}
                    />
                    <span
                      className="text-[8px] font-semibold text-gray-900"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {tier.toUpperCase().slice(0, 4)}
                    </span>
                    <span
                      className="text-[8px] text-gray-600"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {owned}/{total}
                    </span>
                    <span
                      className="text-[8px] text-gray-500"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Item types - horizontal bar list */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            ITEM TYPES
          </h3>
          <div className="flex flex-col gap-2">
            {itemTypes.map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2">
                <span
                  className="w-20 shrink-0 text-[8px] font-semibold text-gray-700"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {tier.toUpperCase()}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full rounded bg-blue-500"
                    style={{
                      width: `${(count / maxItemTypeCount) * 100}%`,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
                <span
                  className="w-6 shrink-0 text-right text-[8px] font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game totals - stat grid */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            GAME TOTALS
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center"
              style={{ border: "2px solid #3b82f6" }}
            >
              <div
                className="text-outline text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {totalSpecies}
              </div>
              <div
                className="mt-1 text-[8px] font-semibold text-gray-700"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                SPECIES
              </div>
            </div>
            <div
              className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center"
              style={{ border: "2px solid #a855f7" }}
            >
              <div
                className="text-outline text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {Object.keys(bagData).length}
              </div>
              <div
                className="mt-1 text-[8px] font-semibold text-gray-700"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                ITEMS
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <a
            href="https://indieun.com/cab/rots"
            target="_blank"
            rel="noopener noreferrer"
            className="stud-input block rounded-cab-sm px-4 py-3 text-center text-[10px] font-bold uppercase text-gray-900 no-underline transition-all hover:bg-blue-50"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            📊 VIEW API DOCS
          </a>
        </div>

        <p
          className="text-center text-[8px] text-white/60"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          NOT AFFILIATED WITH ROBLOX
        </p>
      </div>
    </div>
  );
}
