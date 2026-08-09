"use client";

import { useMemo, useState, useEffect } from "react";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import type { Species } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";

export function DamageCalculatorView() {
  const state = useAppState();

  const rots = useMemo(
    () =>
      Object.entries(state.rotsData)
        .map(([name, species]) => ({ name, species }))
        .sort((a, b) => a.species.FullName.localeCompare(b.species.FullName)),
    [state.rotsData]
  );

  const [attackerName, setAttackerName] = useState("");
  const [defenderName, setDefenderName] = useState("");
  const [movePower, setMovePower] = useState(1.5);
  const [damageBonus, setDamageBonus] = useState(1);
  const [targetReduction, setTargetReduction] = useState(0.15);
  const [critChance, setCritChance] = useState(0.2);
  const [critMultiplier, setCritMultiplier] = useState(1.5);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!attackerName && rots[0]) {
      setAttackerName(rots[0].name);
    }
    if (!defenderName && rots[1]) {
      setDefenderName(rots[1].name);
    } else if (!defenderName && rots[0]) {
      setDefenderName(rots[0].name);
    }
  }, [attackerName, defenderName, rots]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const attacker = state.rotsData[attackerName] ?? null;
  const defender = state.rotsData[defenderName] ?? null;

  const damageState = useMemo(() => {
    if (!attacker || !defender) {
      return null;
    }

    const baseDamage = attacker.Attack * movePower * damageBonus;
    const reducedDamage = Math.max(1, baseDamage * (1 - targetReduction));
    const critDamage = reducedDamage * critMultiplier;
    const averageDamage = reducedDamage * (1 + critChance * (critMultiplier - 1));
    const hitsToKo = Math.max(1, Math.ceil(defender.Health / reducedDamage));
    const critHitsToKo = Math.max(1, Math.ceil(defender.Health / critDamage));
    const averageHitsToKo = Math.max(1, Math.ceil(defender.Health / averageDamage));

    return {
      baseDamage,
      reducedDamage,
      critDamage,
      averageDamage,
      hitsToKo,
      critHitsToKo,
      averageHitsToKo,
    };
  }, [attacker, defender, movePower, damageBonus, targetReduction, critChance, critMultiplier]);

  const pickRots = (label: string, value: string, onChange: (value: string) => void) => (
    <label className="block rounded-[1rem] border border-black/20 bg-white/80 p-3">
      <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="stud-input h-10 w-full rounded-xl px-3 text-sm text-slate-900"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {rots.map(({ name, species }) => (
          <option key={name} value={name}>
            {species.FullName}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          DAMAGE CALCULATOR
        </h2>
        <p className="max-w-2xl text-center text-[11px] uppercase tracking-[0.25em] text-slate-700">
          Estimate damage, crit spikes, and hits to KO using CAB rots stats.
        </p>
      </div>

      <div className="grid flex-1 gap-4 overflow-y-auto pb-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
              1. SELECT ROUGHT MATCHUP
            </h3>
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-700">
              {rots.length} rots loaded
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pickRots("Attacker", attackerName, setAttackerName)}
            {pickRots("Defender", defenderName, setDefenderName)}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { key: "movePower", label: "Move power", value: movePower, min: 0.5, max: 5, step: 0.1, setter: setMovePower },
              { key: "damageBonus", label: "Damage bonus", value: damageBonus, min: 0.5, max: 3, step: 0.1, setter: setDamageBonus },
              { key: "targetReduction", label: "Target reduction", value: targetReduction, min: 0, max: 0.75, step: 0.05, setter: setTargetReduction },
              { key: "critChance", label: "Crit chance", value: critChance, min: 0, max: 1, step: 0.05, setter: setCritChance },
              { key: "critMultiplier", label: "Crit multiplier", value: critMultiplier, min: 1, max: 4, step: 0.1, setter: setCritMultiplier },
            ].map((control) => (
              <label key={control.key} className="rounded-[1rem] border border-black/20 bg-white/80 p-3">
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-700">
                  <span>{control.label}</span>
                  <span className="text-slate-900">
                    {control.key === "critChance" || control.key === "targetReduction"
                      ? `${Math.round(control.value * 100)}%`
                      : `${control.value.toFixed(1)}×`}
                  </span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(e) => control.setter(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-yellow-400"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-[1rem] border border-black/20 bg-white/80 p-3 text-sm text-slate-800">
            <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">
              Formula
            </div>
            <p className="leading-relaxed text-slate-700">
              Damage = Attacker Attack × Move Power × Damage Bonus × (1 - Target Reduction)
            </p>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-black/20 bg-[#f8f6ef] p-4 shadow-[inset_0_2px_2px_rgba(255,255,255,0.7)]" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-900" style={{ fontFamily: "var(--font-pixel), monospace" }}>
              2. DAMAGE OUTPUT
            </h3>
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-700">
              Estimated only
            </span>
          </div>

          {!attacker || !defender || !damageState ? (
            <div className="rounded-[1rem] border border-dashed border-black/20 bg-white/80 p-6 text-center text-sm text-slate-700">
              Select an attacker and defender to calculate damage.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-black/20 bg-white/80 p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-700">Attacker</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-900">{attacker.FullName}</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-600">Attack {attacker.Attack.toFixed(1)}</div>
                </div>
                <div className="rounded-[1rem] border border-black/20 bg-white/80 p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-700">Defender</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-900">{defender.FullName}</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-600">Health {defender.Health.toFixed(1)}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Base damage", value: damageState.baseDamage },
                  { label: "After reduction", value: damageState.reducedDamage },
                  { label: "Crit damage", value: damageState.critDamage },
                  { label: "Average damage", value: damageState.averageDamage },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1rem] border border-black/20 bg-white/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-700">{item.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{item.value.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1rem] border border-black/20 bg-white/80 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">KO estimates</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "Normal hits", value: damageState.hitsToKo },
                    { label: "Crit hits", value: damageState.critHitsToKo },
                    { label: "Average hits", value: damageState.averageHitsToKo },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-[#f8f6ef] px-3 py-2 text-center" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "50px 50px", backgroundRepeat: "repeat" }}>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-700">{item.label}</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1rem] border border-black/20 bg-white/80 p-3 text-sm text-slate-700">
                Higher crit chance and multiplier improve spike damage, while target reduction lowers sustained output.
              </div>
            </div>
          )}
        </section>
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
