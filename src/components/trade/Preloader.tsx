"use client";

import { useEffect, useState } from "react";

/**
 * Preloader - full-screen black overlay with optional message.
 * Currently shows on initial page load. Can also be triggered manually
 * via the `visible` prop to wrap game data loading.
 *
 * A .GIF animation will be dropped in later - pass as `children`.
 */
export function Preloader({
  /** How long to stay fully visible before fading. */
  minDurationMs = 900,
  /** Fade duration. */
  fadeMs = 400,
  /** Override the default black screen with custom children (e.g. a GIF). */
  children,
  /** Manual message - replaces the default "LOADING" text. */
  message = "LOADING",
  /** If true, stays visible until manually set to false (controlled mode). */
  visible,
}: {
  minDurationMs?: number;
  fadeMs?: number;
  children?: React.ReactNode;
  message?: string;
  /** Controlled mode - when provided, ignores the auto-dismiss logic. */
  visible?: boolean;
}) {
  const [autoVisible, setAutoVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Auto-dismiss mode (initial page load only)
  useEffect(() => {
    if (visible !== undefined) return; // controlled mode

    const start = Date.now();
    const finish = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDurationMs - elapsed);
      window.setTimeout(() => {
        setFading(true);
        window.setTimeout(() => setAutoVisible(false), fadeMs);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      const fallback = window.setTimeout(finish, minDurationMs + 2000);
      return () => {
        window.removeEventListener("load", finish);
        window.clearTimeout(fallback);
      };
    }
  }, [minDurationMs, fadeMs, visible]);

  const isVisible = visible !== undefined ? visible : autoVisible;
  if (!isVisible) return null;

  const isControlled = visible !== undefined;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] grid place-items-center"
      style={{
        background: "#000000",
        opacity: isControlled ? (visible ? 1 : 0) : fading ? 0 : 1,
        transition: `opacity ${fadeMs}ms ease-out`,
        pointerEvents: isControlled ? (visible ? "auto" : "none") : fading ? "none" : "auto",
      }}
    >
      {children ?? <DefaultLoadingIndicator message={message} />}
    </div>
  );
}

function DefaultLoadingIndicator({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      <span
        className="text-[10px] tracking-[0.3em] text-white/40"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {message}
      </span>
    </div>
  );
}
