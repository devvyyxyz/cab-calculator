"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { DamageCalculatorView } from "@/components/views/DamageCalculatorView";
import { CompareView } from "@/components/views/CompareView";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { useAppState } from "@/components/app/AppStateProvider";

export function BattleHubView() {
  const state = useAppState();
  const [tab, setTab] = useState<"team" | "simulator" | "damage" | "compare">("team");

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          BATTLE
        </h2>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap justify-center gap-2">
        {([
          { id: "team", icon: "backpack", label: "TEAM" },
          { id: "simulator", icon: "repeat", label: "SIMULATOR" },
          { id: "damage", icon: "scale", label: "DAMAGE" },
          { id: "compare", icon: "info-box", label: "COMPARE" },
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

      <div className="flex-1 overflow-y-auto pb-4">
        {tab === "team" && (
          <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 text-sm text-slate-800 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-700">
              Team Builder
            </p>
            <p className="leading-relaxed text-slate-700">
              Build and optimize your team composition. Select brainrots, balance roles, and prepare for battle.
            </p>
            <div className="rounded-2xl border border-black/20 bg-white/80 p-3 text-[11px] uppercase tracking-[0.2em] text-slate-700">
              Team builder tools coming soon
            </div>
          </div>
        )}

        {tab === "simulator" && (
          <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 text-sm text-slate-800 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-700">
              Battle Simulator
            </p>
            <p className="leading-relaxed text-slate-700">
              Run full battle simulations with your team. Test strategies, calculate win rates, and refine your approach.
            </p>
            <div className="rounded-2xl border border-black/20 bg-white/80 p-3 text-[11px] uppercase tracking-[0.2em] text-slate-700">
              Battle simulator coming soon
            </div>
          </div>
        )}

        {tab === "damage" && <DamageCalculatorView embedded />}

        {tab === "compare" && <CompareView embedded />}
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
