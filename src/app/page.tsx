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
  const [navView, setNavView] = useState<NavView>("trade");

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
        if (!cancelled) setLoading(null);
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

  // ----- Onboarding complete — fetch inventory and dismiss modal -----
  const handleOnboarded = useCallback(
    (userId: string, displayName: string, avatarUrl?: string) => {
      setYouProfile({ id: userId, displayName, avatarUrl });
      setOnboarded(true);
      void loadYourInventory(userId);
    },
    [loadYourInventory]
  );

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

  const reset = useCallback(() => {
    setYourOffer(EMPTY_OFFER);
    setTheirOffer(EMPTY_OFFER);
    toast("Trade reset");
  }, []);

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
          onClick={() => {
            // "you" side needs loaded inventory; "them" side opens catalog directly
            if (side === "you" && !yourData) {
              toast.error("Load your inventory first");
              return;
            }
            setInventoryOpenFor(side);
          }}
        />
      );
    }

    return slots;
  };

  return (
    <>
      <Preloader />
      {!onboarded && <Onboarding onConfirm={handleOnboarded} />}
      <SideNav active={navView} onNavigate={setNavView} />
      <main
        suppressHydrationWarning
        className="relative min-h-screen w-full overflow-x-hidden pl-16 sm:pl-20"
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
        <>
          <section className="relative z-10 mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-4 px-4 pb-44 sm:px-6 md:grid-cols-2 md:pb-28">
            <TradePanel
              title="YOUR OFFER"
              variant="you"
              total={yourTotal}
              valuedRots={yourValued}
              items={yourItems}
              inventoryLoaded={!!yourData}
              onOpenInventory={() => setInventoryOpenFor("you")}
            >
              {renderOfferSlots("you")}
            </TradePanel>

            <TradePanel
              title="THEIR OFFER"
              variant="them"
              total={theirTotal}
              valuedRots={theirValued}
              items={theirItems}
              inventoryLoaded={true}
              onOpenInventory={() => setInventoryOpenFor("them")}
            >
              {renderOfferSlots("them")}
            </TradePanel>

            <FairnessBadge verdict={v} />
          </section>

          <div className="mx-auto flex max-w-7xl justify-center px-4 pb-28 sm:px-6">
            <PixelButton variant="amber" size="sm" onClick={reset}>
              RESET TRADE
            </PixelButton>
          </div>
        </>
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

      {loading === "meta" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white/10 p-6 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p
              className="text-sm text-white"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              LOADING GAME DATA...
            </p>
          </div>
        </div>
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
  inventoryLoaded,
  onOpenInventory,
  children,
}: {
  title: string;
  variant: "you" | "them";
  total: number;
  valuedRots: ValuedRot[];
  items: ValuedItem[];
  inventoryLoaded: boolean;
  onOpenInventory: () => void;
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

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <PixelButton
          variant={inventoryLoaded ? "dark" : "amber"}
          size="sm"
          onClick={onOpenInventory}
          disabled={!inventoryLoaded}
          className="flex-1"
        >
          {inventoryLoaded ? "+ ADD ITEMS" : "LOAD INV FIRST"}
        </PixelButton>
      </div>
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
            background: "#1a1f2e",
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
              className="h-8 flex-1 min-w-[100px] bg-white/10 text-xs text-white placeholder:text-white/40"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {tab === "items" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {filteredBag.map(([name, info]) => {
                  const inOffer = offerItems.find((i) => i.name === name)?.qty ?? 0;
                  return (
                    <div
                      key={name}
                      className="flex flex-col gap-2 rounded-xl bg-white/5 p-2"
                      style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                          {info.Icon && (
                            <Image
                              src={iconUrl(info.Icon)}
                              alt={name}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-full w-full object-contain [image-rendering:pixelated]"
                            />
                          )}
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
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          value={qtyInput[name] ?? "1"}
                          onChange={(e) =>
                            setQtyInput((p) => ({ ...p, [name]: e.target.value }))
                          }
                          className="h-7 w-12 bg-white/10 px-1 text-xs text-white"
                        />
                        <PixelButton
                          variant="green"
                          size="sm"
                          onClick={() => {
                            const n = Math.max(
                              1,
                              parseInt(qtyInput[name] ?? "1", 10) || 1
                            );
                            onAddItem(name, n);
                          }}
                          className="flex-1"
                        >
                          ADD
                        </PixelButton>
                      </div>
                    </div>
                  );
                })}
                {filteredBag.length === 0 && (
                  <EmptyState text="No items match your search" />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredSpecies.map(([name, sp]) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-2"
                    style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                      {sp.Icon && (
                        <Image
                          src={iconUrl(sp.Icon)}
                          alt={name}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-contain [image-rendering:pixelated]"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">
                        {sp.FullName}
                      </div>
                      <div className="truncate text-[10px] text-white/60">
                        {sp.ShortenedName}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                        <Badge>Rarity {sp.Rarity.toFixed(2)}</Badge>
                        {sp.IsExclusive && <Badge color="#dc2626">DEMON</Badge>}
                        {sp.SpawnLocation && (
                          <Badge color="#374151">
                            W{sp.SpawnLocation.World}Z{sp.SpawnLocation.Zone}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <PixelButton
                      variant="green"
                      size="sm"
                      onClick={() => onAddCatalogRot?.(name)}
                    >
                      +
                    </PixelButton>
                  </div>
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
          background: "#1a1f2e",
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
            className="h-8 flex-1 min-w-[100px] bg-white/10 text-xs text-white placeholder:text-white/40"
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
                  <div
                    key={name}
                    className="flex flex-col gap-2 rounded-xl bg-white/5 p-2"
                    style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                        {info?.Icon && (
                          <Image
                            src={iconUrl(info.Icon)}
                            alt={name}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-contain [image-rendering:pixelated]"
                          />
                        )}
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
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={remaining}
                        value={qtyInput[name] ?? "1"}
                        onChange={(e) =>
                          setQtyInput((p) => ({ ...p, [name]: e.target.value }))
                        }
                        className="h-7 w-12 bg-white/10 px-1 text-xs text-white"
                      />
                      <PixelButton
                        variant={side === "you" ? "blue" : "green"}
                        size="sm"
                        disabled={remaining <= 0}
                        onClick={() => {
                          const n = Math.max(
                            1,
                            Math.min(remaining, parseInt(qtyInput[name] ?? "1", 10) || 1)
                          );
                          onAddItem(name, n);
                        }}
                        className="flex-1"
                      >
                        ADD
                      </PixelButton>
                    </div>
                  </div>
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
                  <div
                    key={rot.UID}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-2"
                    style={{
                      border: `2px solid ${
                        inOffer ? accent : "rgba(255,255,255,0.1)"
                      }`,
                    }}
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-black/30 p-1">
                      {sp?.Icon && (
                        <Image
                          src={iconUrl(sp.Icon)}
                          alt={rot.Species}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-contain [image-rendering:pixelated]"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">
                        {rot.Nickname || rot.Species}
                      </div>
                      <div className="truncate text-[10px] text-white/60">
                        {rot.Species}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                        <Badge>L{rot.Level}</Badge>
                        <Badge>IV {(rot.IV * 100).toFixed(0)}%</Badge>
                        {sp?.Rarity !== undefined && (
                          <Badge>Rarity {sp.Rarity.toFixed(2)}</Badge>
                        )}
                        {sp?.IsExclusive && <Badge color="#dc2626">DEMON</Badge>}
                        <Badge color="#374151">{rot.Box}</Badge>
                      </div>
                    </div>
                    <PixelButton
                      variant={inOffer ? "dark" : side === "you" ? "blue" : "green"}
                      size="sm"
                      disabled={inOffer}
                      onClick={() => onAddRot(rot)}
                    >
                      {inOffer ? "✓" : "+"}
                    </PixelButton>
                  </div>
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
  if (isExclusive) return "#7f1d1d"; // demon = deep red
  if (rarity >= 5) return "#fbbf24"; // legendary = gold
  if (rarity >= 4) return "#a3e635"; // epic = bright green
  if (rarity >= 3) return "#e5e7eb"; // rare = light grey
  if (rarity >= 2) return "#fca5a5"; // uncommon = light red
  return "#c62828"; // common = deep red
}

/** Brainrots page — grid of all species, color-coded by rarity tier. */
function BrainrotsView({
  rotsData,
}: {
  rotsData: Record<string, Species>;
}) {
  const [search, setSearch] = useState("");
  const species = Object.entries(rotsData);
  const filtered = species.filter(([name, sp]) =>
    `${name} ${sp.ShortenedName} ${sp.FullName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 pb-28 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          BRAINROTS
        </h2>
        <p className="text-[10px] text-white/70">
          {species.length} species · color = rarity tier
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search brainrots..."
          className="h-9 max-w-md bg-white/95 text-sm text-gray-900"
        />
      </div>

      {/* Grid — 8 columns on desktop like the in-game collection view */}
      <div
        className="grid grid-cols-4 gap-2 rounded-xl p-3 sm:grid-cols-6 md:grid-cols-8"
        style={{
          background: "#1a1f2e",
          border: "4px solid #0d1018",
          boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.45)",
        }}
      >
        {filtered.map(([name, sp]) => (
          <div
            key={name}
            className="group relative aspect-square cursor-help"
            style={{
              background: rarityTierColor(sp.Rarity, sp.IsExclusive),
              borderRadius: "18%",
              boxShadow:
                "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
            }}
            title={`${sp.FullName} · Rarity ${sp.Rarity.toFixed(2)}${sp.IsExclusive ? " · DEMON" : ""}${sp.SpawnLocation ? ` · W${sp.SpawnLocation.World}Z${sp.SpawnLocation.Zone}` : ""}`}
          >
            <Image
              src={iconUrl(sp.Icon)}
              alt={sp.FullName}
              fill
              unoptimized
              className="h-full w-full object-contain p-1 [image-rendering:pixelated]"
            />
            {/* Hover tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
              {sp.ShortenedName} · R{sp.Rarity.toFixed(1)}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <EmptyState text="No brainrots match your search" />
        )}
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
  const items = Object.entries(bagData);
  const filtered = items.filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 pb-28 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          ITEMS
        </h2>
        <p className="text-[10px] text-white/70">{items.length} item types</p>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search items..."
          className="h-9 max-w-md bg-white/95 text-sm text-gray-900"
        />
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-4 gap-2 rounded-xl p-3 sm:grid-cols-6 md:grid-cols-8"
        style={{
          background: "#1a1f2e",
          border: "4px solid #0d1018",
          boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.45)",
        }}
      >
        {filtered.map(([name, info]) => (
          <div
            key={name}
            className="group relative aspect-square cursor-help"
            style={{
              background: "#374151",
              borderRadius: "18%",
              boxShadow:
                "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
            }}
            title={`${name} — ${info.Description}`}
          >
            <Image
              src={iconUrl(info.Icon)}
              alt={name}
              fill
              unoptimized
              className="h-full w-full object-contain p-1 [image-rendering:pixelated]"
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
              {name}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <EmptyState text="No items match your search" />
        )}
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

  const teamRots = yourData.Team;
  const pcRots = yourData.PC;
  const bagEntries = Object.entries(yourData.Bag).filter(([, q]) => q > 0);
  const currentRots = tab === "team" ? teamRots : pcRots;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 pb-28 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          YOUR INVENTORY
        </h2>
        <p className="text-[10px] text-white/70">
          {teamRots.length} team · {pcRots.length} PC · {bagEntries.length} bag types
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex justify-center gap-2">
        {(["team", "pc", "bag"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-md px-4 py-2 text-[10px] uppercase transition-colors"
            style={{
              background: tab === t ? "#7cb3ff" : "rgba(255,255,255,0.1)",
              color: "#fff",
              fontFamily: "var(--font-pixel), monospace",
              boxShadow: tab === t ? "0 2px 0 #1e3a5f" : "none",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          >
            {t === "team" ? `TEAM (${teamRots.length})` : t === "pc" ? `PC (${pcRots.length})` : `BAG (${bagEntries.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "bag" ? (
        <div
          className="grid grid-cols-3 gap-2 rounded-xl p-3 sm:grid-cols-5 md:grid-cols-7"
          style={{
            background: "#1a1f2e",
            border: "4px solid #0d1018",
            boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.45)",
          }}
        >
          {bagEntries.map(([name, qty]) => {
            const info = bagData[name];
            return (
              <div
                key={name}
                className="group relative aspect-square"
                style={{
                  background: "#374151",
                  borderRadius: "18%",
                  boxShadow:
                    "inset 0 2px 2px 0 rgba(255,255,255,0.15), inset 0 -2px 3px 0 rgba(0,0,0,0.4)",
                }}
                title={`${name} ×${qty}`}
              >
                {info?.Icon && (
                  <Image
                    src={iconUrl(info.Icon)}
                    alt={name}
                    fill
                    unoptimized
                    className="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                  />
                )}
                <span
                  className="absolute bottom-0.5 right-0.5 rounded px-1 text-[8px] text-white"
                  style={{
                    background: "#1f2937",
                    fontFamily: "var(--font-pixel), monospace",
                  }}
                >
                  ×{qty}
                </span>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                  {name}
                </div>
              </div>
            );
          })}
          {bagEntries.length === 0 && (
            <EmptyState text="No bag items" />
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-2 rounded-xl p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          style={{
            background: "#1a1f2e",
            border: "4px solid #0d1018",
            boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.45)",
          }}
        >
          {currentRots.map((rot) => {
            const sp = rotsData[rot.Species];
            return (
              <div
                key={rot.UID}
                className="group relative aspect-square"
                style={{
                  background: rarityTierColor(sp?.Rarity ?? 0, sp?.IsExclusive ?? false),
                  borderRadius: "18%",
                  boxShadow:
                    "inset 0 2px 2px 0 rgba(255,255,255,0.4), inset 0 -2px 3px 0 rgba(0,0,0,0.3)",
                }}
                title={`${rot.Nickname || rot.Species} · L${rot.Level} · IV ${(rot.IV * 100).toFixed(0)}%`}
              >
                {sp?.Icon && (
                  <Image
                    src={iconUrl(sp.Icon)}
                    alt={rot.Species}
                    fill
                    unoptimized
                    className="h-full w-full object-contain p-1 [image-rendering:pixelated]"
                  />
                )}
                <span
                  className="absolute bottom-0.5 left-0.5 rounded px-1 text-[8px] text-white"
                  style={{
                    background: "#1f2937",
                    fontFamily: "var(--font-pixel), monospace",
                  }}
                >
                  L{rot.Level}
                </span>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[9px] text-white group-hover:block">
                  {rot.Nickname || rot.Species} · L{rot.Level} · IV {(rot.IV * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
          {currentRots.length === 0 && (
            <EmptyState text={`No ${tab === "team" ? "team" : "PC"} rots`} />
          )}
        </div>
      )}
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
