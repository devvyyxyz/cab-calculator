"use client";

import { PixelIcon } from "@/components/trade/PixelIcon";

export function AccountSwitchModal({
  open,
  onClose,
  onConfirm,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: { id: string; displayName: string; avatarUrl?: string } | null;
}) {
  if (!open) return null;

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
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover [image-rendering:pixelated]"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gray-200">
                <PixelIcon name="backpack" size={32} color="#6b7280" />
              </div>
            )}
          </div>
          <h3
            className="text-outline-white text-lg font-bold text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            SWITCH ACCOUNT
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            {profile?.displayName ? `Logged in as ${profile.displayName}` : "No account linked"}
          </p>
          {profile?.id && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
              ID: {profile.id}
            </p>
          )}
        </div>

        <p
          className="mb-4 text-center text-sm text-gray-700"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          Do you want to switch to a different Roblox account?
        </p>

        <div className="flex gap-2">
          <button
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
            onClick={onConfirm}
            className="btn-follow flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-bold text-white"
            style={{
              fontFamily: "var(--font-pixel), monospace",
              border: "2px solid #7f1d1d",
              boxShadow: "0 3px 0 0 #7f1d1d",
            }}
          >
            YES, SWITCH
          </button>
        </div>
      </div>
    </div>
  );
}
