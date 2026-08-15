"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SmartImage } from "@/components/trade/SmartImage";
import { Trash, Pencil } from "pixelarticons/react";
import { rarityTier } from "@/lib/trade-utils";
import { iconUrl } from "@/lib/cab-client";
import type { Rot, Species } from "@/lib/cab-types";
import { useAppState } from "@/components/app/AppStateProvider";
import { Input } from "@/components/ui/input";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { InventoryDrawer } from "@/components/trade/InventoryDrawer";

const CACHE_KEY = "cab_team_builder";

const EMPTY_ROT: Rot = {
  Box: "",
  IV: 0,
  Level: 1,
  Moveset: [],
  Nickname: "",
  Serial: null,
  Species: "",
  UID: "",
};

export function TeamBuilderView() {
  const state = useAppState();
  const [team, setTeam] = useState<Rot[]>(() => Array.from({ length: 6 }, () => ({ ...EMPTY_ROT, UID: crypto.randomUUID() })));
  const [drawerSlot, setDrawerSlot] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Rot[];
        if (Array.isArray(parsed) && parsed.length === 6) {
          setTeam(parsed.map((r) => ({ ...r, UID: r.UID || crypto.randomUUID() })));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(team));
    } catch {
      /* ignore */
    }
  }, [team]);

  const selectedRot = selectedSlot !== null ? team[selectedSlot] : null;
  const selectedSpecies = selectedRot?.Species ? state.rotsData[selectedRot.Species] : null;

  const openDrawer = (index: number) => {
    setDrawerSlot(index);
  };

  const handleAddCatalogRot = useCallback((speciesName: string) => {
    if (drawerSlot === null) return;
    const next = [...team];
    const sp = state.rotsData[speciesName];
    const moveset = sp?.Moveset ?? [];
    const hasCharge = moveset.includes("Charge");
    const currentMoves = next[drawerSlot].Moveset;
    const newMoves = hasCharge && !currentMoves.includes("Charge")
      ? [...currentMoves, "Charge"].slice(0, 3)
      : currentMoves;
    next[drawerSlot] = {
      ...next[drawerSlot],
      Species: speciesName,
      Nickname: sp?.ShortenedName || next[drawerSlot].Nickname,
      Moveset: newMoves,
    };
    setTeam(next);
    setDrawerSlot(null);
  }, [drawerSlot, team, state.rotsData]);

  const updateSlot = (index: number, patch: Partial<Rot>) => {
    const next = [...team];
    next[index] = { ...next[index], ...patch };
    setTeam(next);
  };

  const clearSlot = (index: number) => {
    const next = [...team];
    next[index] = { ...EMPTY_ROT, UID: crypto.randomUUID() };
    setTeam(next);
    if (selectedSlot === index) setSelectedSlot(null);
  };

  const toggleMove = (index: number, move: string) => {
    const rot = team[index];
    const has = rot.Moveset.includes(move);
    let nextMoves: string[];
    if (has) {
      nextMoves = rot.Moveset.filter((m) => m !== move);
    } else if (rot.Moveset.length >= 3) {
      return;
    } else {
      nextMoves = [...rot.Moveset, move];
    }
    updateSlot(index, { Moveset: nextMoves });
  };

  const availableMoves = useMemo(() => {
    const moves = new Set<string>();
    for (const sp of Object.values(state.rotsData)) {
      for (const move of sp.Moveset ?? []) {
        moves.add(move);
      }
    }
    return Array.from(moves).sort();
  }, [state.rotsData]);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 pt-4 sm:px-6">
      <div className="mb-4 flex shrink-0 flex-col items-center gap-2">
        <h2
          className="text-outline text-center text-2xl text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          TEAM BUILDER
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
          Build your custom team
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((rot, index) => {
            const sp = rot.Species ? state.rotsData[rot.Species] : undefined;
            const tier = sp ? rarityTier(sp.Rarity, sp.IsExclusive) : null;
            const name = rot.Nickname || sp?.ShortenedName || sp?.FullName || "Empty Slot";
            const filled = !!rot.Species;
            const isSelected = selectedSlot === index;

            return (
              <div
                key={rot.UID}
                className={`relative flex items-center gap-3 rounded-xl border p-3 shadow-sm transition-all ${isSelected ? "border-yellow-400 ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0099ff]" : "border-black/20"}`}
                style={{
                  backgroundColor: filled ? (tier?.color ?? "#374151") : "#f3f4f6",
                  backgroundImage: filled ? "url('/stud_texture.png')" : "none",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: filled ? "overlay" : "normal",
                }}
              >
                <button
                  onClick={() => {
                    if (filled) {
                      setSelectedSlot(isSelected ? null : index);
                    } else {
                      openDrawer(index);
                    }
                  }}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/20 p-1">
                    {filled && sp ? (
                      <SmartImage
                        src={iconUrl(sp.Icon)}
                        alt={sp.FullName}
                        imgClassName="h-full w-full object-contain [image-rendering:pixelated]"
                        fallbackSize={32}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-white/40">
                        <PixelIcon name="plus" size={28} color="#9ca3af" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-semibold uppercase tracking-wide ${filled ? "text-white" : "text-gray-400"}`}
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      {name}
                    </div>
                    {filled && (
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-white/80">
                        <span>LVL {rot.Level}</span>
                        <span>·</span>
                        <span>{rot.Moveset.length}/3 MOVES</span>
                      </div>
                    )}
                    {!filled && (
                      <div className="mt-1 text-[10px] text-gray-400">
                        Click to add rot
                      </div>
                    )}
                  </div>
                </button>

                {filled && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSlot(isSelected ? null : index);
                      }}
                      className="absolute right-2 top-2 rounded-lg bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      <Pencil width={14} height={14} style={{ color: isSelected ? "#fbbf24" : "#ffffff" }} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSlot(index);
                      }}
                      className="absolute right-2 bottom-2 rounded-lg bg-red-500/80 p-1.5 text-white transition-colors hover:bg-red-500"
                      style={{ fontFamily: "var(--font-pixel), monospace" }}
                    >
                      <Trash width={14} height={14} style={{ color: "#ffffff" }} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="relative mt-6 rounded-xl border border-black/20 bg-white p-5 shadow-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          {selectedSlot === null && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
              <p
                className="text-center text-xs uppercase tracking-widest text-gray-500"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                Select a rot to see options
              </p>
            </div>
          )}

          <div className={`mb-4 flex items-center justify-between ${selectedSlot === null ? "opacity-50" : ""}`}>
            <h3
              className="text-outline-white text-sm text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              EDIT OPTIONS
            </h3>
            {selectedSlot !== null && (
              <button
                onClick={() => setSelectedSlot(null)}
                className="rounded-lg bg-gray-200 p-1.5 text-gray-600 transition-colors hover:bg-gray-300"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                <PixelIcon name="close" size={16} color="#374151" />
              </button>
            )}
          </div>

          <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${selectedSlot === null ? "pointer-events-none opacity-50" : ""}`}>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">
                Level
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={selectedSlot !== null ? selectedRot?.Level ?? 1 : 1}
                onChange={(e) => selectedSlot !== null && updateSlot(selectedSlot, { Level: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
                className="stud-input h-9 text-sm text-gray-900"
                style={{ borderRadius: "0.875rem", fontFamily: "var(--font-pixel), monospace" }}
                disabled={selectedSlot === null || !selectedSpecies}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-600">
                Moves (max 3)
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-black/10 bg-white/80 p-2" style={{ backgroundImage: "url('/stud_texture.png')", backgroundSize: "30px 30px", backgroundRepeat: "repeat", backgroundBlendMode: "multiply" }}>
                {availableMoves.length === 0 ? (
                  <div className="p-2 text-[10px] text-gray-500">Loading moves...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {availableMoves.map((move) => {
                      const selected = selectedSlot !== null && selectedRot?.Moveset.includes(move);
                      return (
                        <button
                          key={move}
                          type="button"
                          onClick={() => selectedSlot !== null && toggleMove(selectedSlot, move)}
                          className={`rounded-lg border-2 px-2 py-1.5 text-left text-[10px] transition-all ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                          style={{ fontFamily: "var(--font-pixel), monospace" }}
                        >
                          <span className={`block truncate ${selected ? "font-bold text-blue-900" : "text-gray-700"}`}>
                            {move}
                          </span>
                          {selected && (
                            <span className="text-[8px] text-blue-600">SELECTED</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {drawerSlot !== null && (
        <InventoryDrawer
          side="them"
          data={null}
          rotsData={state.rotsData}
          bagData={state.bagData}
          onClose={() => setDrawerSlot(null)}
          onAddRot={() => {}}
          onAddItem={() => {}}
          onAddCatalogRot={handleAddCatalogRot}
          offerRots={[]}
          offerItems={[]}
        />
      )}

      <AccountSwitchModal
        open={state.showAccountModal}
        onClose={() => state.setShowAccountModal(false)}
        onConfirm={state.handleSwitchAccount}
        profile={state.youProfile}
      />
    </div>
  );
}
