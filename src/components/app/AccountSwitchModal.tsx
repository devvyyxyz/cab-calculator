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
        className="w-full max-w-md rounded-xl border-4 border-black/50 bg-white/95 p-6 shadow-2xl"
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
            <span className="text-xl">👤</span>
          </div>
          <div className="flex flex-col">
            <h3
              className="text-outline-white text-lg font-bold text-gray-900"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              SWITCH ACCOUNT
            </h3>
            <p className="text-xs text-gray-600">
              Currently logged in as:
            </p>
          </div>
        </div>

        <div
          className="mb-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-3"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "20px 20px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-10 w-10 rounded-lg object-cover [image-rendering:pixelated]"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-200">
                <span className="text-xs">👤</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-sm font-bold text-gray-900"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                {profile?.displayName ?? "Unknown"}
              </div>
              <div className="truncate text-xs text-gray-600">
                ID: {profile?.id}
              </div>
            </div>
          </div>
        </div>

        <p
          className="mb-4 text-sm text-gray-700"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          Do you want to switch to a different account?
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-300"
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
            className="flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"
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
