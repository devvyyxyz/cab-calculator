"use client";

import { useState } from "react";
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
 * Onboarding modal — runs on first load.
 * Flow:
 *   1. Ask for Roblox username
 *   2. Fetch matches from /api/roblox/user
 *   3. If one exact match → confirm "is this you?"
 *   4. If multiple matches → let user pick
 *   5. Once confirmed, fetch their CAB inventory and continue
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
      // Fetch avatars for all matches in parallel
      const withAvatars = await Promise.all(
        found.map(async (u) => {
          try {
            const aRes = await fetch(
              `/api/roblox/avatar?userId=${u.id}`
            );
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

      // If exactly one exact-match, go to confirm
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

  const confirmAndLoad = async (user: RobloxUser) => {
    setSelected(user);
    setStage("loading-inv");
    // The parent will handle inventory loading — just pass back the user info
    setTimeout(() => {
      onConfirm(String(user.id), user.displayName, user.avatarUrl);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(180deg, #1a1f2e 0%, #0f1320 100%)",
          border: "4px solid #1e3a5f",
          boxShadow: "0 8px 0 0 rgba(0,0,0,0.6)",
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
            className="h-18 w-18 rounded-xl object-cover [image-rendering:pixelated]"
          />
        </div>

        <h2
          className="text-outline mb-2 text-center text-base text-white"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          WELCOME
        </h2>
        <p className="mb-5 text-center text-xs text-white/70">
          {stage === "input" && "Enter your Roblox username to load your Catch a Brainrot inventory"}
          {stage === "searching" && "Searching Roblox..."}
          {stage === "confirm" && "Is this you?"}
          {stage === "multiple" && "Multiple matches found — pick your account"}
          {stage === "loading-inv" && "Loading your inventory..."}
          {stage === "error" && "Something went wrong"}
        </p>

        {/* Stage: input */}
        {stage === "input" && (
          <div className="flex flex-col gap-3">
            <Input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search();
              }}
              placeholder="Your Roblox username"
              className="h-11 bg-white/95 text-sm text-gray-900"
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
                  className="mb-2 flex w-full items-center gap-3 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
                  style={{ border: "2px solid rgba(255,255,255,0.1)" }}
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
  );
}

function UserCard({ user }: { user: RobloxUser }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
      style={{ border: "2px solid rgba(255,255,255,0.12)" }}
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
        className="grid place-items-center rounded-lg bg-white/10"
        style={{ width: size, height: size }}
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
      className="rounded-lg object-cover [image-rendering:pixelated]"
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}
