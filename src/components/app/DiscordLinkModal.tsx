"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PixelIcon } from "@/components/trade/PixelIcon";

export function DiscordLinkModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (discordId: string, discordName: string) => void;
}) {
  const [discordId, setDiscordId] = useState("");
  const [discordName, setDiscordName] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordId.trim() || !discordName.trim()) {
      toast.error("Please enter both Discord ID and username");
      return;
    }
    onConfirm(discordId.trim(), discordName.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border-4 border-black/50 bg-white/95 p-6 shadow-2xl"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "30px 30px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "multiply",
        }}
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 h-20 w-20 overflow-hidden rounded-2xl border-4 border-black/40 bg-white/80 p-1 shadow-[0_4px_0_rgba(0,0,0,0.25)]">
            <div className="grid h-full w-full place-items-center bg-indigo-100">
              <PixelIcon name="book-open" size={32} color="#6366f1" />
            </div>
          </div>
          <h3
            className="text-outline-white text-lg font-bold text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            LINK DISCORD ACCOUNT
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Link your Discord to save trades to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">
              Discord Username
            </label>
            <Input
              value={discordName}
              onChange={(e) => setDiscordName(e.target.value)}
              placeholder="username#0000"
              className="h-10 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">
              Discord User ID
            </label>
            <Input
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="123456789012345678"
              className="h-10 text-xs"
            />
          </div>
          <p className="text-[10px] text-gray-500">
            You can find your Discord ID by enabling Developer Mode in Discord settings and right-clicking your profile.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-follow flex-1 rounded-lg bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                border: "2px solid #9ca3af",
                boxShadow: "0 3px 0 0 #6b7280",
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="btn-follow flex-1 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-bold text-white"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                border: "2px solid #3730a3",
                boxShadow: "0 3px 0 0 #3730a3",
              }}
            >
              LINK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
