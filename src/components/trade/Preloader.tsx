"use client";

import { useEffect, useState } from "react";

/**
 * Initial preloader — currently a plain black screen.
 * This is a placeholder; a .GIF animation will be dropped in later.
 *
 * Behaviour:
 *   - Shows immediately on mount
 *   - Fades out after a short delay OR once the app signals it's ready,
 *     whichever comes first
 *   - Stays mounted during the fade-out so the transition is smooth
 */
export function Preloader({
  /** How long to stay fully visible before fading. */
  minDurationMs = 900,
  /** Fade duration. */
  fadeMs = 400,
  /** Override the default black screen with custom children (e.g. a GIF). */
  children,
}: {
  minDurationMs?: number;
  fadeMs?: number;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Wait for the document to be fully loaded (fonts, images, etc.)
    const start = Date.now();

    const finish = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDurationMs - elapsed);
      window.setTimeout(() => {
        setFading(true);
        window.setTimeout(() => setVisible(false), fadeMs);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      // Safety fallback in case 'load' never fires
      const fallback = window.setTimeout(finish, minDurationMs + 2000);
      return () => {
        window.removeEventListener("load", finish);
        window.clearTimeout(fallback);
      };
    }
  }, [minDurationMs, fadeMs]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] grid place-items-center"
      style={{
        background: "#000000",
        opacity: fading ? 0 : 1,
        transition: `opacity ${fadeMs}ms ease-out`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {children ?? <DefaultLoadingIndicator />}
    </div>
  );
}

/** Default placeholder content — pure black screen with a tiny spinner.
 *  Replace with an <img src="/loader.gif" /> when the animation is ready. */
function DefaultLoadingIndicator() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Spinner — minimal, just so the screen isn't 100% empty */}
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      <span
        className="text-[10px] tracking-[0.3em] text-white/40"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        LOADING
      </span>
    </div>
  );
}
