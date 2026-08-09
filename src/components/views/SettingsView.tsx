"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { ComingSoonSetting } from "@/components/app/ComingSoonSetting";
import { useAppState } from "@/components/app/AppStateProvider";

export function SettingsView() {
  const state = useAppState();
  const [cacheCleared, setCacheCleared] = useState(false);

  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("cab_")
      );
      keys.forEach((k) => {
        if (k !== "cab_profile") localStorage.removeItem(k);
      });
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            SETTINGS
          </h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            ACCOUNT
          </h3>
          <div className="flex items-center gap-3">
            {state.youProfile?.avatarUrl ? (
              <img
                src={state.youProfile.avatarUrl}
                alt={state.youProfile.displayName}
                className="h-12 w-12 rounded-lg object-cover [image-rendering:pixelated]"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-gray-200">
                <PixelIcon name="info-box" size={24} color="#6b7280" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">
                {state.youProfile?.displayName ?? "Not logged in"}
              </div>
              <div className="truncate text-xs text-gray-600">
                {state.youProfile ? `ID: ${state.youProfile.id}` : ""}
              </div>
            </div>
            {state.youProfile && (
              <button
                onClick={state.handleSwitchAccount}
                className="rounded-lg bg-red-500 px-3 py-2 text-[9px] uppercase text-white transition-transform active:translate-y-0.5"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  boxShadow: "0 2px 0 #7f1d1d",
                }}
              >
                LOGOUT
              </button>
            )}
          </div>
        </div>

        <div
          className="mb-6 rounded-xl border border-white/10 bg-white/95 p-4 shadow-lg backdrop-blur-sm"
          style={{
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "30px 30px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
          }}
        >
          <h3
            className="text-outline-white mb-3 text-sm text-gray-900"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            PREFERENCES
          </h3>

          <button
            onClick={clearCache}
            className={`flex items-center justify-center transition-transform active:translate-y-0.5 ${cacheCleared ? "bg-green-500" : "bg-red-500"} text-white`}
            style={{
              fontFamily: "var(--font-pixel), monospace",
              width: "3rem",
              height: "3rem",
              boxShadow: cacheCleared ? "0 2px 0 #15803d" : "0 2px 0 #7f1d1d",
            }}
            aria-label={cacheCleared ? "Cache cleared" : "Clear cache"}
          >
            <PixelIcon name="switch" size={18} color="#ffffff" />
          </button>

          <ComingSoonSetting label="THEME" />
          <ComingSoonSetting label="NOTIFICATIONS" />
          <ComingSoonSetting label="TRADE ALERTS" />
          <ComingSoonSetting label="DEFAULT SORT" />
          <ComingSoonSetting label="LANGUAGE" />
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
