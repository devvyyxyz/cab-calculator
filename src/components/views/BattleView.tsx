"use client";

import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { useAppState } from "@/components/app/AppStateProvider";

export function BattleView({ title = "BATTLE" }: { title?: string }) {
  const state = useAppState();

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          {title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 text-sm text-slate-800 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-700">
            Battle tools
          </p>
          <p className="leading-relaxed text-slate-700">
            This battle module is ready for team composition, combat simulation, damage math, and comparison tools.
          </p>
          <div className="rounded-2xl border border-black/20 bg-white/80 p-3 text-[11px] uppercase tracking-[0.2em] text-slate-700">
            Placeholder view for the next battle feature set
          </div>
        </div>
      </div>

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
