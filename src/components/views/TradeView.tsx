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

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-44 sm:px-6 sm:pb-28">
        <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">
          <TradePanel
            title="YOUR OFFER"
            variant="you"
            total={yourTotal}
            valuedRots={yourValued}
            items={yourItems}
          >
            {state.renderOfferSlots("you")}
          </TradePanel>

          <div className="flex items-center justify-center gap-3 md:hidden">
            <FairnessBadge verdict={v} />
            <ShareButton
              onClick={state.openShare}
              disabled={!sharePayload}
            />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 md:flex">
            <FairnessBadge verdict={v} />
            <ShareButton
              onClick={state.openShare}
              disabled={!sharePayload}
            />
          </div>

          <TradePanel
            title="THEIR OFFER"
            variant="them"
            total={theirTotal}
            valuedRots={theirValued}
            items={theirItems}
          >
            {state.renderOfferSlots("them")}
          </TradePanel>
        </section>
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

      {/* Persistent bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 border-t-4 border-black/30 bg-gray-800/95 p-3 backdrop-blur-sm"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "20px 20px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "multiply",
        }}
      >
        {/* Cancel button */}
        <button
          onClick={() => {
            state.setYourOffer({ rots: [], items: [] });
            state.setTheirOffer({ rots: [], items: [] });
            toast.success("Trade cleared");
          }}
          className="btn-follow h-12 w-12 rounded-full bg-gray-400 active:translate-y-0.5"
          style={{
            border: "3px solid #6b7280",
            boxShadow: "0 3px 0 0 #374151",
          }}
          aria-label="Cancel trade"
        />

        {/* Save button */}
        <button
          onClick={() => state.setShowSaveTradeModal(true)}
          className="btn-follow flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-white enabled:active:translate-y-0.5"
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

        {/* Ready button */}
        <button
          onClick={() => toast.info("Ready status noted")}
          className="btn-follow h-12 w-12 rounded-full bg-gray-400 active:translate-y-0.5"
          style={{
            border: "3px solid #6b7280",
            boxShadow: "0 3px 0 0 #374151",
          }}
          aria-label="Mark as ready"
        />
      </div>
    </div>
  );
}
