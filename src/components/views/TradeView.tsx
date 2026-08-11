"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { TradePanel } from "@/components/trade/TradePanel";
import { FairnessBadge } from "@/components/app/FairnessBadge";
import { ShareButton } from "@/components/app/ShareButton";
import { InventoryDrawer } from "@/components/trade/InventoryDrawer";
import { ShareTradeModal } from "@/components/app/ShareTradeModal";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { DiscordLinkModal } from "@/components/app/DiscordLinkModal";
import { SaveTradeModal } from "@/components/app/SaveTradeModal";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { useAppState } from "@/components/app/AppStateProvider";

export function TradeView() {
  const state = useAppState();

  const yourValued = state.yourValued;
  const theirValued = state.theirValued;
  const yourItems = state.yourItems;
  const theirItems = state.theirItems;
  const yourTotal = state.yourTotal;
  const theirTotal = state.theirTotal;
  const v = state.verdict;
  const sharePayload = state.sharePayload;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://cab.devvyy.xyz";
  const shareLink = state.shareLink;

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            TRADE CALCULATOR
          </h2>
        </div>

        <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <TradePanel
            title="YOUR OFFER"
            variant="you"
            total={yourTotal}
            compareTotal={theirTotal}
          >
            {state.renderOfferSlots("you")}
          </TradePanel>

          <TradePanel
            title="THEIR OFFER"
            variant="them"
            total={theirTotal}
            compareTotal={yourTotal}
          >
            {state.renderOfferSlots("them")}
          </TradePanel>
        </section>

        <section className="relative mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">
          <DetailsTable
            title="YOUR DETAILS"
            variant="you"
            valuedRots={yourValued}
            items={yourItems}
          />
          <DetailsTable
            title="THEIR DETAILS"
            variant="them"
            valuedRots={theirValued}
            items={theirItems}
          />
        </section>
      </div>

      <div className="flex items-center justify-center gap-3 md:hidden">
        <FairnessBadge verdict={v} />
        <button
          onClick={() => state.setShowSaveTradeModal(true)}
          className="btn-follow flex min-w-[6rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-white transition-all enabled:hover:scale-105 enabled:active:translate-y-0.5"
          style={{
            fontFamily: "var(--font-pixel), monospace",
            background: "linear-gradient(180deg, #22c55e, #15803d)",
            border: "3px solid #14532d",
            boxShadow: "0 3px 0 0 #14532d",
          }}
        >
          <PixelIcon name="check" size={16} color="#ffffff" outline="#14532d" outlineWidth={1} />
          Save
        </button>
        <ShareButton
          onClick={state.openShare}
          disabled={!sharePayload}
        />
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 md:flex">
        <FairnessBadge verdict={v} />
        <button
          onClick={() => state.setShowSaveTradeModal(true)}
          className="btn-follow flex min-w-[6rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-white transition-all enabled:hover:scale-105 enabled:active:translate-y-0.5"
          style={{
            fontFamily: "var(--font-pixel), monospace",
            background: "linear-gradient(180deg, #22c55e, #15803d)",
            border: "3px solid #14532d",
            boxShadow: "0 3px 0 0 #14532d",
          }}
        >
          <PixelIcon name="check" size={16} color="#ffffff" outline="#14532d" outlineWidth={1} />
          Save
        </button>
        <ShareButton
          onClick={state.openShare}
          disabled={!sharePayload}
        />
      </div>

      <InventoryDrawer
        side={state.inventoryOpenFor ?? "you"}
        data={state.inventoryOpenFor === "you" ? state.yourData : null}
        rotsData={state.rotsData}
        bagData={state.bagData}
        onClose={() => state.setInventoryOpenFor(null)}
        onAddRot={(rot) => state.addRot(state.inventoryOpenFor ?? "you", rot)}
        onAddItem={(name, qty) => state.addItem(state.inventoryOpenFor ?? "you", name, qty)}
        onAddCatalogRot={(speciesName) => state.addCatalogRot(speciesName)}
        offerRots={
          state.inventoryOpenFor === "you" ? state.yourOffer.rots : state.theirOffer.rots
        }
        offerItems={
          state.inventoryOpenFor === "you" ? state.yourOffer.items : state.theirOffer.items
        }
      />

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />

      <ShareTradeModal
        open={state.shareOpen}
        onClose={() => state.setShareOpen(false)}
        link={shareLink}
        id={state.shareId}
      />

      <DiscordLinkModal
        open={state.showDiscordLinkModal}
        onClose={() => state.setShowDiscordLinkModal(false)}
        onConfirm={state.handleDiscordLink}
      />

      <SaveTradeModal
        open={state.showSaveTradeModal}
        onClose={() => state.setShowSaveTradeModal(false)}
        onSave={state.handleSaveTrade}
      />
    </div>
  );
}

function DetailsTable({
  title,
  variant,
  valuedRots,
  items,
}: {
  title: string;
  variant: "you" | "them";
  valuedRots: ValuedRot[];
  items: ValuedItem[];
}) {
  const bg = variant === "you" ? "#7cb3ff" : "#7ed957";
  const border = variant === "you" ? "#1e3a5f" : "#2e5a1f";

  return (
    <div
      className="relative flex flex-col rounded-3xl overflow-hidden"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      <div className="flex items-center justify-center py-3">
        <h2
          className="text-center text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-[11px]">
          <thead>
            <tr>
              <th className="border-b-2 border-r border-black/20 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-800" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "30px 30px", backgroundRepeat: "repeat", backgroundBlendMode: "overlay" }}>
                Name
              </th>
              <th className="border-b-2 border-r border-black/20 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-800" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "30px 30px", backgroundRepeat: "repeat", backgroundBlendMode: "overlay" }}>
                Info
              </th>
              <th className="border-b-2 border-black/20 px-3 py-2 text-right text-[10px] uppercase tracking-wider text-slate-800" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "30px 30px", backgroundRepeat: "repeat", backgroundBlendMode: "overlay" }}>
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {valuedRots.length === 0 && items.length === 0 ? (
              <tr>
                <td colSpan={3} className="border-b border-black/20 px-3 py-4 text-center text-[10px] uppercase tracking-wider text-slate-500">
                  No items added yet
                </td>
              </tr>
            ) : (
              <>
                {valuedRots.map((r, i) => (
                  <tr key={`rot-${i}`} className={i % 2 === 0 ? "bg-white/40" : "bg-white/20"}>
                    <td className="border-b border-r border-black/20 px-3 py-2 text-left font-semibold text-slate-900">
                      {r.rot.Nickname || r.rot.Species}
                    </td>
                    <td className="border-b border-r border-black/20 px-3 py-2 text-left text-slate-700">
                      L{r.rot.Level} · IV {(r.rot.IV * 100).toFixed(0)}%
                    </td>
                    <td className="border-b border-black/20 px-3 py-2 text-right font-bold text-slate-900">
                      {r.value.toFixed(1)}
                    </td>
                  </tr>
                ))}
                {items.map((it, i) => (
                  <tr key={`item-${i}`} className={(valuedRots.length + i) % 2 === 0 ? "bg-white/40" : "bg-white/20"}>
                    <td className="border-b border-r border-black/20 px-3 py-2 text-left font-semibold text-slate-900">
                      {it.name}
                    </td>
                    <td className="border-b border-r border-black/20 px-3 py-2 text-left text-slate-700">
                      ×{it.qty} ({it.tier})
                    </td>
                    <td className="border-b border-black/20 px-3 py-2 text-right font-bold text-slate-900">
                      {it.total.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
