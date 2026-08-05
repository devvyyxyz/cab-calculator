"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { PixelButton } from "./PixelButton";

interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
  avatarUrl?: string;
}

type Stage = "input" | "searching" | "confirm" | "multiple" | "loading-inv" | "error";

/**
 * Onboarding page — full-screen takeover with the site blue background and a
 * side-scrolling stud texture. Runs on first load until the user confirms
 * their Roblox account.
 */
export function Onboarding({
  onConfirm,
}: {
  onConfirm: (userId: string, displayName: string, avatarUrl?: string) => void;
}) {
  const [stage, setStage] = useState<Stage>("input");
  const [username, setUsername] = useState("");
  const [matches, setMatches] = useState<RobloxUser[]>([]);
  const [selected, setSelected] = useState<RobloxUser | null>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!username.trim()) {
      setError("Enter your Roblox username");
      return;
    }
    setError("");
    setStage("searching");
    try {
      const res = await fetch(
        `/api/roblox/user?username=${encodeURIComponent(username.trim())}`
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const found: RobloxUser[] = data.matches ?? [];
      if (found.length === 0) {
        setError(`No Roblox user found for "${username}"`);
        setStage("error");
        return;
      }
      const withAvatars = await Promise.all(
        found.map(async (u) => {
          try {
            const aRes = await fetch(`/api/roblox/avatar?userId=${u.id}`);
            if (aRes.ok) {
              const aData = await aRes.json();
              return { ...u, avatarUrl: aData.imageUrl };
            }
          } catch {
            /* ignore */
          }
          return u;
        })
      );
      setMatches(withAvatars);

      const exact = withAvatars.filter(
        (u) => u.name.toLowerCase() === username.trim().toLowerCase()
      );
      if (exact.length === 1) {
        setSelected(exact[0]);
        setStage("confirm");
      } else {
        setStage("multiple");
      }
    } catch (e) {
      setError((e as Error).message);
      setStage("error");
    }
  };

  const confirmAndLoad = (user: RobloxUser) => {
    setSelected(user);
    setStage("loading-inv");
    setTimeout(() => {
      onConfirm(String(user.id), user.displayName, user.avatarUrl);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      style={{ backgroundColor: "#0099ff" }}
    >
      {/* Side-scrolling stud texture background */}
      <div
        className="scroll-studs pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "100px 100px",
          backgroundRepeat: "repeat",
          opacity: 0.5,
        }}
      />

      {/* Centered content card with stud background */}
      <div className="relative z-10 grid min-h-screen place-items-center p-4">
        <div
          className="w-full max-w-md overflow-hidden p-6"
          style={{
            backgroundColor: "#1a1f2e",
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "40px 40px",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "soft-light",
            border: "4px solid #1e3a5f",
            boxShadow: "0 8px 0 0 rgba(0,0,0,0.6)",
            borderRadius: "1.5rem",
          }}
        >
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <Image
              src="/cab_icon.png"
              alt="CAB"
              width={72}
              height={72}
              priority
              className="h-18 w-18 object-cover [image-rendering:pixelated]"
              style={{ borderRadius: "1rem" }}
            />
          </div>

          <h2
            className="text-outline mb-5 text-center text-base text-white"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            {stage === "confirm" ? "IS THIS YOU?" : "ENTER USERNAME"}
          </h2>

          {/* Stage: input */}
          {stage === "input" && (
            <div suppressHydrationWarning className="flex flex-col gap-3">
              <Input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") search();
                }}
                placeholder="Your Roblox username"
                className="stud-input h-11 text-sm"
                style={{
                  borderRadius: "0.875rem",
                  fontFamily: "var(--font-pixel), monospace",
                  color: "#1f2937",
                }}
              />
              {error && (
                <p className="text-center text-xs text-red-400">{error}</p>
              )}
              <PixelButton
                variant="blue"
                size="md"
                onClick={search}
                className="w-full"
              >
                SEARCH
              </PixelButton>
            </div>
          )}

          {/* Stage: searching */}
          {stage === "searching" && (
            <div className="flex justify-center py-6">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            </div>
          )}

          {/* Stage: confirm (single match) */}
          {stage === "confirm" && selected && (
            <div className="flex flex-col gap-4">
              <UserCard user={selected} />
              <div className="flex gap-2">
                <PixelButton
                  variant="amber"
                  size="md"
                  onClick={() => {
                    setSelected(null);
                    setMatches([]);
                    setUsername("");
                    setStage("input");
                  }}
                  className="flex-1"
                >
                  NO, RETRY
                </PixelButton>
                <PixelButton
                  variant="green"
                  size="md"
                  onClick={() => confirmAndLoad(selected)}
                  className="flex-1"
                >
                  YES, CONTINUE
                </PixelButton>
              </div>
            </div>
          )}

          {/* Stage: multiple matches */}
          {stage === "multiple" && (
            <div className="flex flex-col gap-2">
              <div className="max-h-72 overflow-y-auto pr-1">
                {matches.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => confirmAndLoad(u)}
                    className="mb-2 flex w-full items-center gap-3 bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                    style={{
                      border: "2px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.875rem",
                    }}
                  >
                    <UserAvatar user={u} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">
                        {u.displayName}
                        {u.hasVerifiedBadge && (
                          <span className="ml-1 text-blue-400" title="Verified">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[10px] text-white/60">
                        @{u.name} · ID {u.id}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <PixelButton
                variant="amber"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  setMatches([]);
                  setUsername("");
                  setStage("input");
                }}
                className="w-full"
              >
                ← BACK TO SEARCH
              </PixelButton>
            </div>
          )}

          {/* Stage: loading inventory */}
          {stage === "loading-inv" && selected && (
            <div className="flex flex-col items-center gap-3 py-4">
              <UserAvatar user={selected} size={56} />
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              <p className="text-center text-[10px] text-white/70">
                Fetching inventory for {selected.displayName}...
              </p>
            </div>
          )}

          {/* Stage: error */}
          {stage === "error" && (
            <div className="flex flex-col gap-3">
              <p className="text-center text-xs text-red-400">{error}</p>
              <PixelButton
                variant="blue"
                size="md"
                onClick={() => {
                  setError("");
                  setStage("input");
                }}
                className="w-full"
              >
                TRY AGAIN
              </PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: RobloxUser }) {
  return (
    <div
      className="flex items-center gap-3 bg-white/5 p-3"
      style={{
        border: "2px solid rgba(255,255,255,0.12)",
        borderRadius: "0.875rem",
      }}
    >
      <UserAvatar user={user} size={56} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">
          {user.displayName}
          {user.hasVerifiedBadge && (
            <span className="ml-1 text-blue-400" title="Verified">
              ✓
            </span>
          )}
        </div>
        <div className="truncate text-[10px] text-white/60">
          @{user.name} · ID {user.id}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ user, size = 48 }: { user: RobloxUser; size?: number }) {
  const [errored, setErrored] = useState(false);
  const src = user.avatarUrl && !errored ? user.avatarUrl : null;

  if (!src) {
    return (
      <div
        className="grid place-items-center bg-white/10"
        style={{ width: size, height: size, borderRadius: "0.5rem" }}
        aria-hidden
      >
        <span className="text-[10px] text-white/40" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          ?
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={user.displayName}
      width={size}
      height={size}
      className="object-cover [image-rendering:pixelated]"
      style={{ width: size, height: size, borderRadius: "0.5rem" }}
      onError={() => setErrored(true)}
    />
  );
}
