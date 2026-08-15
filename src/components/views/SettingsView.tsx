"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/trade/PixelIcon";
import { SettingsCog } from "pixelarticons/react";
import { AccountSwitchModal } from "@/components/app/AccountSwitchModal";
import { ComingSoonSetting } from "@/components/app/ComingSoonSetting";
import { useAppState } from "@/components/app/AppStateProvider";
import { VALUE_METHODS, type ValueMethod, SELL_METHODS, type SellMethod } from "@/lib/trade-values";
import { useSession, signIn, signOut } from "next-auth/react";

export function SettingsView() {
  const state = useAppState();
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"account" | "preferences">("account");
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

  const handleMethodChange = (method: ValueMethod) => {
    state.setValueMethod(method);
    try {
      localStorage.setItem("cab_value_method", method);
    } catch {
      /* ignore */
    }
  };

  const handleSellMethodChange = (method: SellMethod) => {
    state.setSellMethod(method);
    try {
      localStorage.setItem("cab_sell_method", method);
    } catch {
      /* ignore */
    }
  };

  const discordUser = session?.user;
  const isDiscordLoading = status === "loading";

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="shrink-0 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-2">
          <h2
            className="text-outline text-center text-2xl text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            SETTINGS
          </h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex shrink-0 flex-wrap justify-center gap-2">
            {([
              { id: "account", icon: "book-open", label: "ACCOUNT" },
              { id: "preferences", icon: "switch", label: "PREFERENCES" },
            ] as const).map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative flex items-center gap-2 px-4 py-2 text-[10px] uppercase transition-all"
                  style={{
                    color: isActive ? "#1e3a5f" : "#374151",
                    fontFamily: "var(--font-pixel), monospace",
                    borderRadius: "0.875rem",
                    background: isActive ? "rgba(124,179,255,0.6)" : "#f3f4f6",
                    boxShadow: isActive ? "0 2px 0 rgba(30,58,95,0.2)" : "none",
                    transform: isActive ? "translateY(-1px)" : "none",
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

          {tab === "account" && (
            <div className="space-y-4">
              <div
                className="rounded-xl border border-black/20 bg-white p-5 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100">
                    <PixelIcon name="book-open" size={18} color="#3b82f6" />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    ROBLOX ACCOUNT
                  </h3>
                </div>
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
                      className="btn-follow rounded-lg bg-red-500 px-3 py-2 text-[9px] uppercase text-white active:translate-y-0.5"
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
                className="rounded-xl border border-black/20 bg-white p-5 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100">
                    <PixelIcon name="megaphone" size={18} color="#6366f1" />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    DISCORD ACCOUNT
                  </h3>
                </div>

                {isDiscordLoading ? (
                  <div className="text-xs text-gray-500">Loading Discord status...</div>
                ) : discordUser ? (
                  <div className="flex items-center gap-3">
                    {discordUser.image && (
                      <img
                        src={discordUser.image}
                        alt={discordUser.name ?? "Discord user"}
                        className="h-10 w-10 rounded-lg object-cover [image-rendering:pixelated]"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {discordUser.name}
                      </div>
                      <div className="truncate text-xs text-gray-600">
                        {discordUser.email ?? "Connected via Discord"}
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="btn-follow rounded-lg bg-red-500 px-3 py-2 text-[9px] uppercase text-white active:translate-y-0.5"
                      style={{
                        fontFamily: "var(--font-pixel), monospace",
                        boxShadow: "0 2px 0 #7f1d1d",
                      }}
                    >
                      DISCONNECT
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-gray-600">
                      Sign in with Discord to link your account for trade sharing and more.
                    </p>
                    <button
                      onClick={() => signIn("discord")}
                      className="btn-follow flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-xs uppercase text-white active:translate-y-0.5"
                      style={{
                        fontFamily: "var(--font-pixel), monospace",
                        boxShadow: "0 3px 0 #3730a3",
                      }}
                    >
                      <PixelIcon name="book-open" size={16} color="#ffffff" />
                      Sign in with Discord
                    </button>
                  </div>
                )}
              </div>

              <div
                className="rounded-xl border border-black/20 bg-white p-5 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100">
                    <SettingsCog width={18} height={18} style={{ color: "#6b7280" }} />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    MORE SETTINGS
                  </h3>
                </div>
                <p className="mb-3 text-[10px] text-gray-500 uppercase tracking-wide">
                  Additional account options coming soon
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ComingSoonSetting label="DISPLAY NAME" />
                  <ComingSoonSetting label="PRIVACY" />
                </div>
              </div>
            </div>
          )}

          {tab === "preferences" && (
            <div className="space-y-4">
              <div
                className="rounded-xl border border-black/20 bg-white p-5 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-green-100">
                    <PixelIcon name="scale" size={18} color="#22c55e" />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    VALUE CALCULATION
                  </h3>
                </div>
                <div className="mb-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">
                    Value Method
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VALUE_METHODS.map((option) => {
                      const isActive = state.valueMethod === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleMethodChange(option.id)}
                          className={`flex flex-col rounded-lg border-2 p-3 text-left transition-all ${
                            isActive
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                          }`}
                          style={{ fontFamily: "var(--font-pixel), monospace" }}
                        >
                          <span className={`text-sm font-bold ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                            {option.label}
                          </span>
                          <span className="mt-1 text-[9px] text-gray-600">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-700">
                    Sell Method
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SELL_METHODS.map((option) => {
                      const isActive = state.sellMethod === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSellMethodChange(option.id)}
                          className={`flex flex-col rounded-lg border-2 p-3 text-left transition-all ${
                            isActive
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
                          }`}
                          style={{ fontFamily: "var(--font-pixel), monospace" }}
                        >
                          <span className={`text-sm font-bold ${isActive ? "text-green-900" : "text-gray-900"}`}>
                            {option.label}
                          </span>
                          <span className="mt-1 text-[9px] text-gray-600">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl border border-black/20 bg-white p-5 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100">
                    <SettingsCog width={18} height={18} style={{ color: "#f97316" }} />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    DATA & CACHE
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearCache}
                    className={`btn-follow flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs uppercase active:translate-y-0.5 ${cacheCleared ? "bg-green-500" : "bg-red-500"} text-white`}
                    style={{
                      fontFamily: "var(--font-pixel), monospace",
                      boxShadow: cacheCleared ? "0 2px 0 #15803d" : "0 2px 0 #7f1d1d",
                    }}
                  >
                    <SettingsCog width={14} height={14} style={{ color: "#ffffff" }} />
                    {cacheCleared ? "Cleared" : "Clear Cache"}
                  </button>
                  <span className="text-[10px] text-gray-500">
                    Clears local game data and inventory cache
                  </span>
                </div>
              </div>

              <div
                className="rounded-xl border border-black/20 bg-white p-5 shadow-sm"
                style={{
                  backgroundImage: "url('/stud_texture.png')",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-100">
                    <PixelIcon name="chart" size={18} color="#a855f7" />
                  </div>
                  <h3
                    className="text-sm font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    MORE SETTINGS
                  </h3>
                </div>
                <p className="mb-3 text-[10px] text-gray-500 uppercase tracking-wide">
                  Additional preferences coming soon
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ComingSoonSetting label="THEME" />
                  <ComingSoonSetting label="NOTIFICATIONS" />
                  <ComingSoonSetting label="TRADE ALERTS" />
                  <ComingSoonSetting label="DEFAULT SORT" />
                  <ComingSoonSetting label="LANGUAGE" />
                  <ComingSoonSetting label="SOUND EFFECTS" />
                  <ComingSoonSetting label="ANIMATIONS" />
                  <ComingSoonSetting label="AUTO-UPDATE" />
                </div>
              </div>
            </div>
          )}
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
