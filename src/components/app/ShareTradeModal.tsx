"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { TiltCard } from "@/components/trade/TiltCard";

export function ShareTradeModal({
  open,
  onClose,
  link,
  id,
}: {
  open: boolean;
  onClose: () => void;
  link: string;
  id: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const download = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/share/${id}/image`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cab-trade.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Image downloaded");
    } catch {
      toast.error("Could not download image");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <TiltCard
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border-4 border-black/50 bg-white/95 p-6 shadow-2xl"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "30px 30px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "multiply",
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, #7cb3ff, #60a5fa)",
              border: "3px solid #1e3a5f",
              boxShadow: "0 3px 0 0 #1e3a5f",
            }}
          >
            <PixelIcon name="repeat" size={22} color="#fff" outline="#1e3a5f" outlineWidth={1} />
          </div>
          <div className="flex flex-col">
            <h3
              className="text-outline-white text-lg font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              SHARE TRADE
            </h3>
            <p className="text-xs text-gray-600">
              Copy the link or download the image
            </p>
          </div>
        </div>

        {id && link && (
          <div className="mb-4">
            <p
              className="mb-1 text-[9px] font-bold uppercase text-gray-500"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Preview (appears on Discord)
            </p>
            <img
              src={`/api/share/${id}/image`}
              alt="Trade preview"
              className="w-full rounded-lg border-2 border-gray-300 [image-rendering:pixelated]"
            />
          </div>
        )}

        <div className="mb-3 flex gap-2">
          <Input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 min-w-0 flex-1 text-xs"
          />
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-lg bg-blue-500 px-4 text-xs font-bold text-white transition-all hover:bg-blue-600"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              border: "2px solid #1e3a5f",
              boxShadow: "0 3px 0 0 #1e3a5f",
            }}
          >
            {copied ? "✓ COPIED" : "COPY"}
          </button>
        </div>

        <button
          type="button"
          onClick={download}
          disabled={!id}
          className="btn-follow w-full rounded-lg bg-green-500 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontFamily: "var(--font-pixel), monospace",
            border: "2px solid #14532d",
            boxShadow: "0 3px 0 0 #14532d",
          }}
        >
          ⬇ DOWNLOAD IMAGE
        </button>

        <button
          type="button"
          onClick={onClose}
          className="btn-follow mt-2 w-full rounded-lg bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700"
          style={{
            fontFamily: "var(--font-pixel), monospace",
            border: "2px solid #9ca3af",
            boxShadow: "0 3px 0 0 #6b7280",
          }}
        >
          CLOSE
        </button>
      </TiltCard>
    </div>
  );
}
