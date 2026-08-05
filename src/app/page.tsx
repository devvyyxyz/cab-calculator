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

const DEMO_YOU_ID = "1559610713"; // fallback only — real flow uses onboarding

interface Offer {
  rots: Rot[]; // selected rots (max ~6 by game rules, but allow up to SLOTS_PER_PANEL)
  items: { name: string; qty: number }[]; // distinct items
}

const EMPTY_OFFER: Offer = { rots: [], items: [] };

export default function Home() {
  // Onboarding — runs until the user confirms their Roblox account
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

  // ----- Load meta (rots + bag) once -----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading("meta");
      try {
        const [r, b] = await Promise.all([getRots(), getBag()]);
        if (cancelled) return;
        setRotsData((r as RotsResponse).Data);
        setBagData((b as BagResponse).Data);
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

  // ----- Load inventory for "you" side (after onboarding confirms identity) -----
  const loadYourInventory = useCallback(async (userId: string) => {
    setLoading("you");
    try {
      const res = await getInventory(userId.trim());
      const data = (res as { Data: PlayerData }).Data;
      setYourData(data);
      setYourOffer(EMPTY_OFFER);
      toast.success(
        `Loaded your inventory — ${data.PC.length} rots, ${data.Team.length} team, ${Object.keys(data.Bag).length} bag items`
      );
    } catch (e) {
      toast.error(
        `No Catch a Brainrot inventory found for this Roblox account. You can still use the catalog picker.`
      );
    } finally {
      setLoading(null);
    }
  }, []);

  // ----- Onboarding complete — fetch inventory, dismiss modal, save to localStorage -----
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

  // ----- On mount: check localStorage for saved profile -----
  // If found, start onboarding at the "confirm" stage instead of "input".
  // Uses a lazy initializer so the first render already has the saved value
  // (avoids a flash of the "ENTER USERNAME" stage on refresh).
  const [savedProfile, setSavedProfile] = useState<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("cab_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id && parsed?.displayName) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  // ----- Offer manipulation -----
  // For "you" side: rot must come from loaded inventory (real UID).
  // For "them" side: any rot can be added — we generate a synthetic UID.
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

  // Add a rot from the game catalog (species) to the "them" side — used when
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
      {/* Game data preloader — stays until rots + bag are loaded */}
      <Preloader visible={!metaLoaded} message="LOADING GAME DATA" />
      {!onboarded && (
        <Onboarding
          onConfirm={handleOnboarded}
          initialProfile={savedProfile}
        />
      )}
      <SideNav active={navView} onNavigate={setNavView} />
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
      {/* Your profile chip */}
      {youProfile && navView === "trade" && (
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-center px-4 pt-4 sm:px-6">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "2px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
            }}
          >
            {youProfile.avatarUrl ? (
              <img
                src={youProfile.avatarUrl}
                alt={youProfile.displayName}
                className="h-6 w-6 rounded-full [image-rendering:pixelated]"
              />
            ) : null}
            <span
              className="text-outline-sm text-[10px] text-white"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {youProfile.displayName}
            </span>
            <span className="text-[9px] text-white/50">
              · ID {youProfile.id}
            </span>
          </div>
        </div>
      )}

      {/* ===== TRADE VIEW ===== */}
      {navView === "trade" && (
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <>
          <section className="mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-4 px-4 pb-28 sm:px-6 md:grid-cols-2">
            <TradePanel
              title="YOUR OFFER"
              variant="you"
              total={yourTotal}
              valuedRots={yourValued}
              items={yourItems}
            >
              {renderOfferSlots("you")}
            </TradePanel>

            <TradePanel
              title="THEIR OFFER"
              variant="them"
              total={theirTotal}
              valuedRots={theirValued}
              items={theirItems}
            >
              {renderOfferSlots("them")}
            </TradePanel>

            <FairnessBadge verdict={v} />
          </section>
        </>
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

      {/* ===== VALUES VIEW (placeholder) ===== */}
      {navView === "values" && (
        <PlaceholderView title="VALUES" subtitle="Trade value tiers coming soon" />
      )}

      {/* ===== ABOUT VIEW (placeholder) ===== */}
      {navView === "about" && (
        <PlaceholderView title="ABOUT" subtitle="CAB Trade Calculator — value your trades before you ready up" />
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

      </main>
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FairnessBadge({ verdict }: { verdict: TradeVerdict }) {
  // Determine symbol, color, and background based on who's winning
  // +  = you're winning (green)
  // -  = you're losing (red)
  // =  = fair trade (amber)
  const symbol = verdict.winner === "you" ? "+" : verdict.winner === "them" ? "−" : "=";
  const color = verdict.winner === "you" ? "#22c55e" : verdict.winner === "them" ? "#ef4444" : "#fbbf24";
  const borderColor = verdict.winner === "you" ? "#14532d" : verdict.winner === "them" ? "#7f1d1d" : "#92400e";
  const textColor = verdict.winner === "fair" ? "#1f2937" : "#ffffff";

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%)]"
      style={{ pointerEvents: "auto" }}
    >
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

  return (
    <div
      className="relative flex flex-col rounded-3xl p-3 sm:p-4"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      {/* Title bar — centered, large, outlined with a darker shade of the panel color */}
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

      {/* Slots grid — shared dark recessed background surrounding all slots */}
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

      {/* Value breakdown */}
      {(valuedRots.length > 0 || items.length > 0) && (
        <div className="mt-3 max-h-44 overflow-y-auto rounded-xl bg-black/25 p-2 text-[10px] text-white/90">
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
  const [qtyInput, setQtyInput] = useState<Record<string, string>>({});

  const accent = side === "you" ? "#7cb3ff" : "#7ed957";
  const accentBorder = side === "you" ? "#1e3a5f" : "#2e5a1f";

  // ---- Catalog mode (them side, no inventory) ----
  if (catalogMode) {
    const allSpecies = Object.entries(rotsData);
    const allBag = Object.entries(bagData);
    const filteredSpecies = allSpecies.filter(([name, sp]) =>
      `${name} ${sp.ShortenedName} ${sp.FullName}`.toLowerCase().includes(search.toLowerCase())
    );
    const filteredBag = allBag.filter(([name]) =>
      name.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div
        className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
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
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ background: accent, borderBottom: `3px solid ${accentBorder}` }}
          >
            <div>
              <h3
                className="text-outline text-sm text-white sm:text-base"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                THEIR ITEMS — CATALOG
              </h3>
              <p className="text-[10px] text-white/90">
                Pick any brainrot or item · {allSpecies.length} rots · {allBag.length} items
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white shadow-[0_3px_0_#7f1d1d]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tabs + search */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2">
            <div className="flex gap-1">
              {(["rots", "items"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="rounded-md px-3 py-1.5 text-[10px] uppercase transition-colors"
                  style={{
                    background: tab === t ? accent : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "var(--font-pixel), monospace",
                    boxShadow: tab === t ? `0 2px 0 ${accentBorder}` : "none",
                  }}
                >
                  {t === "rots" ? `Rots (${allSpecies.length})` : `Items (${allBag.length})`}
                </button>
              ))}
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search..."
              className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {tab === "items" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {filteredBag.map(([name, info]) => {
                  const inOffer = offerItems.find((i) => i.name === name)?.qty ?? 0;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onAddItem(name, 1)}
                      className="flex flex-col gap-2 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/15"
                      style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                          <SmartImage
                            src={info.Icon ? iconUrl(info.Icon) : ""}
                            alt={name}
                            className="h-full w-full"
                            imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                            fallbackSize={24}
                            fill={false}
                            showCaption={false}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-white">
                            {name}
                          </div>
                          <div className="text-[10px] text-white/60">
                            In offer: {inOffer}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredBag.length === 0 && (
                  <EmptyState text="No items match your search" />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredSpecies.map(([name, sp]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onAddCatalogRot?.(name)}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/15"
                    style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                      <SmartImage
                        src={sp.Icon ? iconUrl(sp.Icon) : ""}
                        alt={name}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                        fallbackSize={28}
                        fill={false}
                        showCaption={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">
                        {sp.FullName}
                      </div>
                      <div className="truncate text-[10px] text-white/60">
                        {sp.ShortenedName}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredSpecies.length === 0 && (
                  <EmptyState text="No rots match your search" />
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
  const teamRots = data.Team;
  const pcRots = data.PC;
  const bagEntries = Object.entries(data.Bag).filter(([, q]) => q > 0);

  const filteredTeam = teamRots.filter((r) =>
    `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPc = pcRots.filter((r) =>
    `${r.Nickname} ${r.Species}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBag = bagEntries.filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const isRotInOffer = (uid: string) =>
    offerRots.some((r) => r.UID === uid);
  const itemQtyInOffer = (name: string) =>
    offerItems.find((i) => i.name === name)?.qty ?? 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl sm:w-full sm:max-w-4xl sm:rounded-3xl"
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
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ background: accent, borderBottom: `3px solid ${accentBorder}` }}
        >
          <div>
            <h3
              className="text-outline text-sm text-white sm:text-base"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              {side === "you" ? "YOUR" : "THEIR"} INVENTORY
            </h3>
            <p className="text-[10px] text-white/90">
              {allRots.length} rots · {bagEntries.length} item types · click to add to offer
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white shadow-[0_3px_0_#7f1d1d]"
            aria-label="Close inventory"
          >
            ✕
          </button>
        </div>

        {/* Tabs + search */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2">
          <div className="flex gap-1">
            {(["team", "pc", "bag"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-md px-3 py-1.5 text-[10px] uppercase transition-colors"
                style={{
                  background: tab === t ? accent : "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontFamily: "var(--font-pixel), monospace",
                  boxShadow: tab === t ? `0 2px 0 ${accentBorder}` : "none",
                }}
              >
                {t === "team" ? `Team (${teamRots.length})` : t === "pc" ? `PC (${pcRots.length})` : `Bag (${bagEntries.length})`}
              </button>
            ))}
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search..."
            className="stud-input h-8 flex-1 min-w-[100px] text-xs text-gray-900 placeholder:text-gray-500"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {tab === "bag" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {filteredBag.map(([name, qty]) => {
                const inOffer = itemQtyInOffer(name);
                const info = bagData[name];
                const remaining = qty - inOffer;
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={remaining <= 0}
                    onClick={() => onAddItem(name, 1)}
                    className="flex flex-col gap-2 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/15 disabled:opacity-40"
                    style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                        <SmartImage
                          src={info?.Icon ? iconUrl(info.Icon) : ""}
                          alt={name}
                          className="h-full w-full"
                          imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                          fallbackSize={24}
                          fill={false}
                          showCaption={false}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">
                          {name}
                        </div>
                        <div className="text-[10px] text-white/60">
                          Owned: {qty} · In offer: {inOffer}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredBag.length === 0 && (
                <EmptyState text="No bag items match your search" />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(tab === "team" ? filteredTeam : filteredPc).map((rot) => {
                const sp = rotsData[rot.Species];
                const inOffer = isRotInOffer(rot.UID);
                return (
                  <button
                    key={rot.UID}
                    type="button"
                    disabled={inOffer}
                    onClick={() => onAddRot(rot)}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/15 disabled:opacity-40"
                    style={{
                      border: `2px solid ${
                        inOffer ? accent : "rgba(255,255,255,0.1)"
                      }`,
                    }}
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                      <SmartImage
                        src={sp?.Icon ? iconUrl(sp.Icon) : ""}
                        alt={rot.Species}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                        fallbackSize={28}
                        fill={false}
                        showCaption={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">
                        {rot.Nickname || rot.Species}
                      </div>
                      <div className="truncate text-[10px] text-white/60">
                        {rot.Species}
                      </div>
                    </div>
                  </button>
                );
              })}
              {(tab === "team" ? filteredTeam : filteredPc).length === 0 && (
                <EmptyState text={`No ${tab === "team" ? "team" : "PC"} rots match your search`} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  color = "rgba(255,255,255,0.1)",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-white"
      style={{
        background: color,
        fontFamily: "var(--font-pixel), monospace",
      }}
    >
      {children}
    </span>
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

// ============================================================
// Full-page views (sidebar navigation)
// ============================================================

/** Rarity tier → background color for slot tiles. Matches the in-game look
 *  where slots are color-coded by rarity tier. */
function rarityTierColor(rarity: number, isExclusive: boolean): string {
  return rarityTier(rarity, isExclusive).color;
}

/** Brainrots page — grid of all species, color-coded by rarity tier, with shimmer for rare+. */
function BrainrotsView({
  rotsData,
}: {
  rotsData: Record<string, Species>;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rarity-asc" | "rarity-desc" | "name-az" | "name-za">("rarity-asc");
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
      {/* Header — fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          BRAINROTS
        </h2>
      </div>

      {/* Search + Sort row — fixed */}
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
            { value: "rarity-asc", label: "Rarity ↑" },
            { value: "rarity-desc", label: "Rarity ↓" },
            { value: "name-az", label: "Name A-Z" },
            { value: "name-za", label: "Name Z-A" },
          ]}
        />
      </div>

      {/* Scrollable content — grid + legend */}
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

/** Single brainrot slot — extracted for reuse. */
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

/** Section divider — a large titled header that separates groups when sorted. */
function SectionDivider({ label }: { label: string; color?: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 py-3">
      <h3
        className="text-outline text-lg text-white sm:text-2xl"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {label}
      </h3>
      <div className="h-0.5 flex-1 rounded-full bg-white/15" />
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

/** Items page — grid of all bag items. */
function ItemsView({
  bagData,
}: {
  bagData: Record<string, BagItemInfo>;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"type" | "name-az" | "name-za">("type");
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
      {/* Header — fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          ITEMS
        </h2>
      </div>

      {/* Search + Sort row — fixed */}
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

      {/* Scrollable content — grid */}
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

/** Single item slot — extracted for reuse. */
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
      title={`${name} — ${info.Description}`}
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

/** Inventory page — shows the player's loaded inventory (team, PC, bag). */
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
  const [sortBy, setSortBy] = useState<"rarity-asc" | "rarity-desc" | "name-az" | "name-za" | "level-asc" | "level-desc">("rarity-asc");

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
      // default: type
      return classifyItem(a[0]).tier.localeCompare(classifyItem(b[0]).tier) || a[0].localeCompare(b[0]);
    });
  const currentRots = tab === "team" ? teamRots : pcRots;

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      {/* Header — fixed */}
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          YOUR INVENTORY
        </h2>
      </div>

      {/* Search — fixed */}
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

      {/* Tab pills — fixed */}
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

      {/* Scrollable content — slots float on page bg */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {tab === "bag" ? (
          <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-5 md:grid-cols-7 sm:p-2">
            {(() => {
              if (bagEntries.length === 0) {
                return <EmptyState text="No bag items" />;
              }
              // When sorted by type (default), group by tier with section dividers
              if (sortBy === "rarity-asc") {
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
                      <InventoryBagSlot key={name} name={name} qty={qty} info={bagData[name]} />
                    ))}
                  </div>
                ));
              }
              return bagEntries.map(([name, qty]) => (
                <InventoryBagSlot key={name} name={name} qty={qty} info={bagData[name]} />
              ));
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:p-2">
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
                      <InventoryRotSlot key={rot.UID} rot={rot} sp={rotsData[rot.Species]} />
                    ))}
                  </div>
                ));
              }
              return currentRots.map((rot) => (
                <InventoryRotSlot key={rot.UID} rot={rot} sp={rotsData[rot.Species]} />
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/** Single inventory rot slot — extracted for reuse. */
function InventoryRotSlot({ rot, sp }: { rot: Rot; sp?: Species }) {
  const tier = rarityTier(sp?.Rarity ?? 0, sp?.IsExclusive ?? false);
  return (
    <div
      className={`group relative aspect-square ${tier.shimmer ? "shimmer-rare" : ""}`}
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
    </div>
  );
}

/** Single inventory bag slot — extracted for reuse. */
function InventoryBagSlot({ name, qty, info }: { name: string; qty: number; info?: BagItemInfo }) {
  return (
    <div
      className="group relative aspect-square"
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
    </div>
  );
}

/** Placeholder view for not-yet-built pages. */
function PlaceholderView({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6">
      <h2
        className="text-outline text-2xl text-white sm:text-3xl"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-[10px] text-white/70">{subtitle}</p>
    </div>
  );
}
