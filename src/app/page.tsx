"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PixelButton } from "@/components/trade/PixelButton";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";
import { SideNav, type NavView } from "@/components/trade/SideNav";
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
} from "@/lib/trade-values";

const SLOTS_PER_PANEL = 12; // 4 cols x 3 rows

const DEMO_YOU_ID = "1559610713";
const DEMO_THEM_ID = "1559610713"; // same player by default — user can swap

interface Offer {
  rots: Rot[]; // selected rots (max ~6 by game rules, but allow up to SLOTS_PER_PANEL)
  items: { name: string; qty: number }[]; // distinct items
}

const EMPTY_OFFER: Offer = { rots: [], items: [] };

export default function Home() {
  const [yourId, setYourId] = useState(DEMO_YOU_ID);
  const [theirId, setTheirId] = useState(DEMO_THEM_ID);

  const [yourData, setYourData] = useState<PlayerData | null>(null);
  const [theirData, setTheirData] = useState<PlayerData | null>(null);

  const [rotsData, setRotsData] = useState<Record<string, Species>>({});
  const [bagData, setBagData] = useState<Record<string, BagItemInfo>>({});

  const [yourOffer, setYourOffer] = useState<Offer>(EMPTY_OFFER);
  const [theirOffer, setTheirOffer] = useState<Offer>(EMPTY_OFFER);

  const [inventoryOpenFor, setInventoryOpenFor] = useState<"you" | "them" | null>(
    null
  );

  const [loading, setLoading] = useState<"you" | "them" | "meta" | null>(null);
  const [yourReady, setYourReady] = useState(false);
  const [theirReady, setTheirReady] = useState(false);
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

  // ----- Load inventory for a side -----
  const loadInventory = useCallback(
    async (side: "you" | "them", id: string) => {
      if (!id.trim()) {
        toast.error("Please enter a user ID");
        return;
      }
      setLoading(side);
      try {
        const res = await getInventory(id.trim());
        const data = (res as { Data: PlayerData }).Data;
        if (side === "you") {
          setYourData(data);
          setYourOffer(EMPTY_OFFER);
          setYourReady(false);
        } else {
          setTheirData(data);
          setTheirOffer(EMPTY_OFFER);
          setTheirReady(false);
        }
        toast.success(
          `Loaded ${side === "you" ? "your" : "their"} inventory — ${data.PC.length} rots, ${
            data.Team.length
          } team, ${Object.keys(data.Bag).length} bag items`
        );
      } catch (e) {
        toast.error(
          `Failed to load inventory for ${id}: ${(e as Error).message}`
        );
      } finally {
        setLoading(null);
      }
    },
    []
  );

  // ----- Offer manipulation -----
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
    setYourReady(false);
    setTheirReady(false);
    toast("Trade reset");
  }, []);

  // ----- Render helpers -----
  const renderOfferSlots = (side: "you" | "them") => {
    const offer = side === "you" ? yourOffer : theirOffer;
    const set = side === "you" ? setYourOffer : setTheirOffer;
    const data = side === "you" ? yourData : theirData;
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
            if (!data) {
              toast.error(
                `Load ${
                  side === "you" ? "your" : "their"
                } inventory first`
              );
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
      {/* Compact user ID loader bar */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-end justify-center gap-2 px-4 pt-4 sm:gap-3 sm:px-6">
        <UserIdInput
          label="YOU"
          value={yourId}
          onChange={setYourId}
          onLoad={() => loadInventory("you", yourId)}
          loading={loading === "you"}
          color="blue"
        />
        <UserIdInput
          label="THEM"
          value={theirId}
          onChange={setTheirId}
          onLoad={() => loadInventory("them", theirId)}
          loading={loading === "them"}
          color="green"
        />
      </div>

      {/* Verdict banner */}
      <section className="relative z-10 mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div
          className="flex flex-col items-stretch gap-2 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
          style={{
            background: "rgba(0,0,0,0.35)",
            boxShadow: "0 4px 0 rgba(0,0,0,0.35)",
            border: "3px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(6px)",
          }}
        >
          <VerdictPill label="YOUR VALUE" value={yourTotal} color="#7cb3ff" />
          <div className="flex flex-1 flex-col items-center justify-center gap-1">
            <div
              className="px-3 py-1.5 text-xs sm:text-sm"
              style={{
                background: v.color,
                color: "#1f2937",
                borderRadius: "10px",
                boxShadow: "0 3px 0 rgba(0,0,0,0.4)",
                fontFamily: "var(--font-pixel), monospace",
                fontWeight: 700,
              }}
            >
              {v.label}
            </div>
            <div className="text-[10px] text-white/80 sm:text-xs">
              {v.winner === "fair"
                ? "Even trade — both sides gain equally"
                : v.winner === "you"
                ? `You're ahead by ${Math.abs(v.diff).toFixed(1)} units (${(
                    v.percent * 100
                  ).toFixed(0)}%)`
                : `They're ahead by ${Math.abs(v.diff).toFixed(1)} units (${(
                    v.percent * 100
                  ).toFixed(0)}%)`}
            </div>
          </div>
          <VerdictPill label="THEIR VALUE" value={theirTotal} color="#7ed957" />
        </div>
      </section>

      {/* Trade window */}
      <section className="relative z-10 mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-4 px-4 pb-44 sm:px-6 md:grid-cols-2 md:pb-28">
        <TradePanel
          title="YOUR OFFER"
          variant="you"
          total={yourTotal}
          valuedRots={yourValued}
          items={yourItems}
          ready={yourReady}
          inventoryLoaded={!!yourData}
          onOpenInventory={() => setInventoryOpenFor("you")}
          onToggleReady={() => {
            if (yourOffer.rots.length + yourOffer.items.length === 0) {
              toast.error("Add at least one item before readying");
              return;
            }
            setYourReady((r) => !r);
          }}
        >
          {renderOfferSlots("you")}
        </TradePanel>

        <TradePanel
          title="THEIR OFFER"
          variant="them"
          total={theirTotal}
          valuedRots={theirValued}
          items={theirItems}
          ready={theirReady}
          inventoryLoaded={!!theirData}
          onOpenInventory={() => setInventoryOpenFor("them")}
          onToggleReady={() => {
            if (theirOffer.rots.length + theirOffer.items.length === 0) {
              toast.error("Add at least one item before readying");
              return;
            }
            setTheirReady((r) => !r);
          }}
        >
          {renderOfferSlots("them")}
        </TradePanel>
      </section>

      {/* Bottom action bar */}
      <footer
        className="fixed bottom-0 right-0 left-16 z-30 border-t-4 border-black/40 px-4 py-3 backdrop-blur-md sm:left-20"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
          <PixelButton
            variant="blue"
            size="md"
            onClick={() => setInventoryOpenFor("you")}
            className="flex-1 sm:flex-none"
          >
            ◀ YOUR ITEMS ▶
          </PixelButton>
          <PixelButton
            variant="amber"
            size="md"
            onClick={reset}
            className="flex-1 sm:flex-none"
          >
            CANCEL
          </PixelButton>
          <PixelButton
            variant={yourReady && theirReady ? "green" : "olive"}
            size="md"
            onClick={() => {
              if (yourReady && theirReady) {
                toast.success("✅ Trade accepted! (simulated)");
              }
              setYourReady((r) => !r);
              setTheirReady((r) => !r);
            }}
            className="flex-1 sm:flex-none"
          >
            {yourReady && theirReady ? "CONFIRM" : "READY"}
          </PixelButton>
          <PixelButton
            variant="green"
            size="md"
            onClick={() => setInventoryOpenFor("them")}
            className="flex-1 sm:flex-none"
          >
            ◀ THEIR ITEMS ▶
          </PixelButton>
        </div>
      </footer>

      {/* Inventory drawer */}
      {inventoryOpenFor && (
        <InventoryDrawer
          side={inventoryOpenFor}
          data={inventoryOpenFor === "you" ? yourData : theirData}
          rotsData={rotsData}
          bagData={bagData}
          onClose={() => setInventoryOpenFor(null)}
          onAddRot={(rot) => addRot(inventoryOpenFor, rot)}
          onAddItem={(name, qty) => addItem(inventoryOpenFor, name, qty)}
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

function UserIdInput({
  label,
  value,
  onChange,
  onLoad,
  loading,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onLoad: () => void;
  loading: boolean;
  color: "blue" | "green";
}) {
  const palette =
    color === "blue"
      ? { bg: "#7cb3ff", shadow: "#1e3a5f", label: "YOUR ID" }
      : { bg: "#7ed957", shadow: "#2e5a1f", label: "THEIR ID" };

  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-[10px] text-white/90"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {palette.label}
      </label>
      <div className="flex items-stretch gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onLoad();
          }}
          inputMode="numeric"
          placeholder="user id"
          className="h-9 w-32 bg-white/95 font-mono text-sm text-gray-900 shadow-[0_2px_0_rgba(0,0,0,0.3)] sm:w-40"
        />
        <PixelButton
          variant={color}
          size="sm"
          onClick={onLoad}
          disabled={loading}
          className="h-9"
        >
          {loading ? "..." : "LOAD"}
        </PixelButton>
      </div>
    </div>
  );
}

function VerdictPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex flex-1 items-center justify-between gap-2 rounded-xl px-3 py-2 sm:flex-none sm:justify-center sm:gap-3"
      style={{
        background: color,
        boxShadow: `0 3px 0 rgba(0,0,0,0.35)`,
        border: "2px solid rgba(0,0,0,0.3)",
      }}
    >
      <span
        className="text-[9px] text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)] sm:text-[10px]"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {label}
      </span>
      <span
        className="text-base text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)] sm:text-lg"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {value.toFixed(0)}
      </span>
    </div>
  );
}

function TradePanel({
  title,
  variant,
  total,
  valuedRots,
  items,
  ready,
  inventoryLoaded,
  onOpenInventory,
  onToggleReady,
  children,
}: {
  title: string;
  variant: "you" | "them";
  total: number;
  valuedRots: ValuedRot[];
  items: ValuedItem[];
  ready: boolean;
  inventoryLoaded: boolean;
  onOpenInventory: () => void;
  onToggleReady: () => void;
  children: React.ReactNode;
}) {
  const bg = variant === "you" ? "#7cb3ff" : "#7ed957";
  const border = variant === "you" ? "#1e3a5f" : "#2e5a1f";
  const headerBg = variant === "you" ? "#5b8dee" : "#5cb843";

  return (
    <div
      className="relative flex flex-col rounded-3xl p-3 sm:p-4"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      {/* Title bar */}
      <div
        className="mb-3 flex items-center justify-between rounded-xl px-3 py-2"
        style={{
          background: headerBg,
          boxShadow: "0 3px 0 rgba(0,0,0,0.3)",
          border: "2px solid rgba(0,0,0,0.25)",
        }}
      >
        <h2
          className="text-sm text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] sm:text-base"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          {title}
        </h2>
        <span
          className="rounded-md bg-black/30 px-2 py-1 text-[10px] text-white sm:text-xs"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          {total.toFixed(0)}
        </span>
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">{children}</div>

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
        <PixelButton
          variant={ready ? "green" : "olive"}
          size="sm"
          onClick={onToggleReady}
          className="flex-1"
        >
          {ready ? "✓ READY" : "READY"}
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
  offerRots: Rot[];
  offerItems: { name: string; qty: number }[];
}) {
  const [tab, setTab] = useState<"team" | "pc" | "bag">("team");
  const [search, setSearch] = useState("");
  const [qtyInput, setQtyInput] = useState<Record<string, string>>({});

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

  const accent = side === "you" ? "#7cb3ff" : "#7ed957";
  const accentBorder = side === "you" ? "#1e3a5f" : "#2e5a1f";

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
              className="text-sm text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] sm:text-base"
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
