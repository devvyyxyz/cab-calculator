"use client";

import { useState } from "react";
import type { ValuedRot, ValuedItem } from "@/lib/trade-values";
import { TradeSlot, RotSlotContent, ItemSlotContent } from "@/components/trade/TradeSlot";
import { PixelIcon } from "@/components/trade/PixelIcon";

export function TradePanel({
  title,
  variant,
  total,
  compareTotal,
  valuedRots,
  items,
  children,
}: {
  title: string;
  variant: "you" | "them";
  total: number;
  compareTotal?: number;
  valuedRots: ValuedRot[];
  items: ValuedItem[];
  children: React.ReactNode;
}) {
  const bg = variant === "you" ? "#7cb3ff" : "#7ed957";
  const border = variant === "you" ? "#1e3a5f" : "#2e5a1f";
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col rounded-3xl p-3 sm:p-4"
      style={{
        background: bg,
        boxShadow: `0 6px 0 0 ${border}, inset 0 2px 0 0 rgba(255,255,255,0.45)`,
        border: `4px solid ${border}`,
      }}
    >
      <div className="mb-4 flex items-center justify-between py-1">
        <h2
          className="text-left text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {title}
        </h2>
        <PixelIcon
          name={compareTotal !== undefined && total < compareTotal ? "arrow-down" : "arrow-up"}
          size={20}
          color="#ffffff"
          outline={border}
          outlineWidth={2}
        />
        <span
          className="text-right text-lg sm:text-2xl"
          style={{
            fontFamily: "var(--font-pixel-bold, var(--font-pixel)), monospace",
            color: "#ffffff",
            WebkitTextStroke: `3px ${border}`,
            paintOrder: "stroke fill",
          }}
        >
          {total.toFixed(0)}
        </span>
      </div>

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

      {(valuedRots.length > 0 || items.length > 0) && (
        <div className="mt-3 overflow-hidden rounded-xl border-2 border-black/30">
          <div
            className="w-full"
            style={{
              backgroundImage: "url('/stud_texture.png')",
              backgroundSize: "30px 30px",
              backgroundRepeat: "repeat",
              backgroundBlendMode: "multiply",
              background: variant === "you" ? "#7cb3ff" : "#7ed957",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            />
            <div className="relative z-10">
              <button
                onClick={() => setDetailsOpen((o) => !o)}
                className="btn-follow flex w-full items-center justify-between px-3 py-2 text-[10px] uppercase text-white"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                <span>DETAILS</span>
                <span
                  style={{
                    transform: detailsOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s",
                    display: "inline-block",
                  }}
                >
                  ▼
                </span>
              </button>
              {detailsOpen && (
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
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
