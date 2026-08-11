"use client";

import { createContext, useContext } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getRots,
  getBag,
  getInventory,
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
import {
  encodeTrade,
  type ShareTrade,
} from "@/lib/share-trade";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";

const SLOTS_PER_PANEL = 12;

interface Offer {
  rots: Rot[];
  items: { name: string; qty: number }[];
}

const EMPTY_OFFER: Offer = { rots: [], items: [] };

export interface AppState {
  onboarded: boolean;
  youProfile: { id: string; displayName: string; avatarUrl?: string } | null;
  yourData: PlayerData | null;
  rotsData: Record<string, Species>;
  bagData: Record<string, BagItemInfo>;
  yourOffer: Offer;
  theirOffer: Offer;
  inventoryOpenFor: "you" | "them" | null;
  loading: "you" | "meta" | null;
  metaLoaded: boolean;
  navView: string;
  valueMethod: "dev" | "rot";
  showAccountModal: boolean;
  shareOpen: boolean;
  savedProfile: { id: string; displayName: string; avatarUrl?: string } | null;
  mounted: boolean;
  shareId: string;
  showDiscordLinkModal: boolean;
  showSaveTradeModal: boolean;
  discordId: string | null;
  discordName: string | null;

  yourValued: ValuedRot[];
  theirValued: ValuedRot[];
  yourItems: ValuedItem[];
  theirItems: ValuedItem[];
  yourTotal: number;
  theirTotal: number;
  verdict: TradeVerdict;
  sharePayload: ShareTrade | null;
  encodedId: string;
  shareLink: string;

  setOnboarded: (v: boolean) => void;
  setYouProfile: (v: { id: string; displayName: string; avatarUrl?: string } | null) => void;
  setYourData: (v: PlayerData | null) => void;
  setRotsData: (v: Record<string, Species>) => void;
  setBagData: (v: Record<string, BagItemInfo>) => void;
  setYourOffer: (v: Offer) => void;
  setTheirOffer: (v: Offer) => void;
  setInventoryOpenFor: (v: "you" | "them" | null) => void;
  setLoading: (v: "you" | "meta" | null) => void;
  setMetaLoaded: (v: boolean) => void;
  setNavView: (v: string) => void;
  setValueMethod: (v: "dev" | "rot") => void;
  setShowAccountModal: (v: boolean) => void;
  setShareOpen: (v: boolean) => void;
  setSavedProfile: (v: { id: string; displayName: string; avatarUrl?: string } | null) => void;
  setMounted: (v: boolean) => void;
  setShareId: (v: string) => void;
  setShowDiscordLinkModal: (v: boolean) => void;
  setShowSaveTradeModal: (v: boolean) => void;
  setDiscordId: (v: string | null) => void;
  setDiscordName: (v: string | null) => void;

  handleDiscordLink: (discordId: string, discordName: string) => void;
  handleSaveTrade: () => Promise<void>;

  handleOnboarded: (userId: string, displayName: string, avatarUrl?: string) => void;
  handleSwitchAccount: () => void;
  handleLogout: () => void;
  loadYourInventory: (userId: string) => Promise<void>;
  addRot: (side: "you" | "them", rot: Rot) => void;
  removeRot: (side: "you" | "them", uid: string) => void;
  addItem: (side: "you" | "them", name: string, qty: number) => void;
  removeItem: (side: "you" | "them", name: string) => void;
  addCatalogRot: (speciesName: string) => void;
  openShare: () => void;
  renderOfferSlots: (side: "you" | "them") => React.ReactNode[];
}

const AppStateContext = createContext<AppState | null>(null);

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
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

  const [inventoryOpenFor, setInventoryOpenFor] = useState<"you" | "them" | null>(null);

  const [loading, setLoading] = useState<"you" | "meta" | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [navView, setNavView] = useState("trade");
  const [valueMethod, setValueMethod] = useState<"dev" | "rot">("dev");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [savedProfile, setSavedProfile] = useState<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shareId, setShareId] = useState("");

  const [showDiscordLinkModal, setShowDiscordLinkModal] = useState(false);
  const [showSaveTradeModal, setShowSaveTradeModal] = useState(false);
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [discordName, setDiscordName] = useState<string | null>(null);

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
      const method = localStorage.getItem("cab_value_method");
      if (method === "dev" || method === "rot") {
        setValueMethod(method);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inventoryOpenFor) {
        setInventoryOpenFor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inventoryOpenFor]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

      setLoading("meta");
      try {
        const [r, b] = await Promise.all([getRots(), getBag()]);
        if (cancelled) return;
        setRotsData((r as RotsResponse).Data);
        setBagData((b as BagResponse).Data);
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

  const loadYourInventory = useCallback(async (userId: string) => {
    setLoading("you");
    try {
      const res = await getInventory(userId.trim());
      const data = (res as { Data: PlayerData }).Data;
      setYourData(data);
      setYourOffer(EMPTY_OFFER);
      try {
        localStorage.setItem(`cab_inventory_${userId}`, JSON.stringify(data));
      } catch {
        /* ignore quota */
      }
      toast.success(
        `Loaded your inventory - ${data.PC.length} rots, ${data.Team.length} team, ${Object.keys(data.Bag).length} bag items`
      );
    } catch (e) {
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
        `No Catch a Brainrot RotDex inventory found for this Roblox account. You can still use the catalog picker.`
      );
    } finally {
      setLoading(null);
    }
  }, []);

  const handleOnboarded = useCallback(
    (userId: string, displayName: string, avatarUrl?: string) => {
      setYouProfile({ id: userId, displayName, avatarUrl });
      setOnboarded(true);
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

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("cab_profile");
      if (youProfile?.id) {
        localStorage.removeItem("cab_inventory_" + youProfile.id);
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, [youProfile]);

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

  const yourValued = useMemo(
    () =>
      yourOffer.rots.map((r) =>
        valueRot(r, rotsData[r.Species], valueMethod)
      ),
    [yourOffer.rots, rotsData, valueMethod]
  );
  const theirValued = useMemo(
    () =>
      theirOffer.rots.map((r) => valueRot(r, rotsData[r.Species], valueMethod)),
    [theirOffer.rots, rotsData, valueMethod]
  );

  const yourItems = useMemo(
    () =>
      yourOffer.items.map((i) =>
        valueItem(i.name, bagData[i.name], i.qty)
      ),
    [yourOffer.items, bagData]
  );
  const theirItems = useMemo(
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

  const verdictMemo = useMemo(() => verdict(yourTotal, theirTotal), [yourTotal, theirTotal]);

  const handleDiscordLink = useCallback(
    (newDiscordId: string, newDiscordName: string) => {
      setDiscordId(newDiscordId);
      setDiscordName(newDiscordName);
      setShowDiscordLinkModal(false);
      toast.success(`Discord account linked: ${newDiscordName}`);
    },
    []
  );

  const handleSaveTrade = useCallback(async () => {
    const currentDiscordId = discordId;
    const currentDiscordName = discordName;

    // If no Discord linked, show the link modal
    if (!currentDiscordId || !currentDiscordName) {
      setShowSaveTradeModal(false);
      setShowDiscordLinkModal(true);
      return;
    }

    setShowSaveTradeModal(false);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: currentDiscordId,
          discordName: currentDiscordName,
          yourOffer: yourOffer,
          theirOffer: theirOffer,
          yourTotal,
          theirTotal,
          verdict: verdictMemo,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save transaction");
      }

      toast.success("Trade saved successfully!");
    } catch (e) {
      toast.error(`Failed to save trade: ${(e as Error).message}`);
    }
  }, [discordId, discordName, yourOffer, theirOffer, yourTotal, theirTotal, verdictMemo]);

  const sharePayload = useMemo<ShareTrade | null>(() => {
    const hasAnything =
      yourOffer.rots.length ||
      yourOffer.items.length ||
      theirOffer.rots.length ||
      theirOffer.items.length;
    if (!hasAnything) return null;

    return {
      you: {
        slots: [
          ...yourValued.map((rv) => ({ i: rv.species?.Icon ?? "" })),
          ...yourItems.map((iv) => ({ i: iv.icon, q: iv.qty })),
        ],
        total: yourTotal,
      },
      them: {
        slots: [
          ...theirValued.map((rv) => ({ i: rv.species?.Icon ?? "" })),
          ...theirItems.map((iv) => ({ i: iv.icon, q: iv.qty })),
        ],
        total: theirTotal,
      },
    };
  }, [
    yourOffer,
    theirOffer,
    yourValued,
    theirValued,
    yourItems,
    theirItems,
    yourTotal,
    theirTotal,
  ]);

  const encodedId = useMemo(
    () => (sharePayload ? encodeTrade(sharePayload) : ""),
    [sharePayload]
  );

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://cab.devvyy.xyz";

  const openShare = useCallback(() => {
    if (!sharePayload) return;
    setShareId(encodedId);
    setShareOpen(true);
    (async () => {
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sharePayload),
        });
        if (res.ok) {
          const data = (await res.json()) as { id?: string };
          if (data.id) setShareId(data.id);
        }
      } catch {
        /* keep fallback link */
      }
    })();
  }, [sharePayload, encodedId]);

  const shareLink = shareId ? `${origin}/share/${shareId}` : "";

  const renderOfferSlots = useCallback((side: "you" | "them") => {
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
  }, [yourOffer, theirOffer, rotsData, bagData, removeRot, removeItem, setInventoryOpenFor]);

  const state: AppState = {
    onboarded,
    youProfile,
    yourData,
    rotsData,
    bagData,
    yourOffer,
    theirOffer,
    inventoryOpenFor,
    loading,
    metaLoaded,
    navView,
    valueMethod,
    showAccountModal,
    shareOpen,
    savedProfile,
    mounted,
    shareId,
    showDiscordLinkModal,
    showSaveTradeModal,
    discordId,
    discordName,

    yourValued,
    theirValued,
    yourItems,
    theirItems,
    yourTotal,
    theirTotal,
    verdict: verdictMemo,
    sharePayload,
    encodedId,
    shareLink,

    setOnboarded,
    setYouProfile,
    setYourData,
    setRotsData,
    setBagData,
    setYourOffer,
    setTheirOffer,
    setInventoryOpenFor,
    setLoading,
    setMetaLoaded,
    setNavView,
    setValueMethod,
    setShowAccountModal,
    setShareOpen,
    setSavedProfile,
    setMounted,
    setShareId,
    setShowDiscordLinkModal,
    setShowSaveTradeModal,
    setDiscordId,
    setDiscordName,

    handleOnboarded,
    handleSwitchAccount,
    handleLogout,
    loadYourInventory,
    addRot,
    removeRot,
    addItem,
    removeItem,
    addCatalogRot,
    openShare,
    renderOfferSlots,
    handleDiscordLink,
    handleSaveTrade,
  };

  return (
    <AppStateContext.Provider value={state}>
      {children}
    </AppStateContext.Provider>
  );
}