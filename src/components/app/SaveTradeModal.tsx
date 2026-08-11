"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { TiltCard } from "@/components/trade/TiltCard";

export function SaveTradeModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } catch {
      // Error handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <TiltCard
        onClick={(e) => e.stopPropagation()}
        className="modal-pop w-full max-w-sm rounded-xl border-4 border-black/50 bg-white/95 p-6 shadow-2xl"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "30px 30px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "multiply",
        }}
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <PixelIcon name="check" size={48} color="#22c55e" />
          <h3
            className="text-outline-white text-lg font-bold text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            SAVE TRADE
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Save this trade to your account history
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-follow flex-1 rounded-lg bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              border: "2px solid #9ca3af",
              boxShadow: "0 3px 0 0 #6b7280",
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-follow flex-1 rounded-lg bg-green-500 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              border: "2px solid #14532d",
              boxShadow: "0 3px 0 0 #14532d",
            }}
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </TiltCard>
    </div>
  );
}
