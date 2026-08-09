"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKGROUNDS = [
  "/backgrounds/battle.png",
  "/backgrounds/cat.png",
  "/backgrounds/desert.png",
  "/backgrounds/egg.png",
  "/backgrounds/illigal_brainrot.png",
];

const FADE_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 1000;

/**
 * Landing page — full-screen hero with rotating background images.
 *
 * Cycles through /public/backgrounds/* with a smooth fade transition.
 * The dark overlay ensures text remains legible against any background.
 */
export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setBgOpacity(0);

      // After fade completes, swap image and fade back in
      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % BACKGROUNDS.length);
        setBgOpacity(1);
      }, FADE_DURATION_MS);

      return () => clearTimeout(timeout);
    }, FADE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background image layer with fade transition */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${BACKGROUNDS[currentIndex]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: bgOpacity,
        }}
        aria-hidden="true"
      />

      {/* Dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
        aria-hidden="true"
      />

      {/* Centered content */}
      <div className="relative z-20 flex max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        {/* Site name */}
        <h1 className="text-4xl font-bold uppercase tracking-wider text-white text-outline-white md:text-6xl lg:text-7xl">
          CAB Calculator
        </h1>

        {/* Tagline */}
        <p className="text-base font-bold uppercase tracking-widest text-white/90 text-outline-sm-white md:text-lg">
          Creatures and Buddies Trade Tool
        </p>

        {/* Brief description */}
        <p className="max-w-lg text-sm leading-relaxed text-white/80 md:text-base">
          Calculate fair trade values, manage your inventory, and build the perfect
          team. Your essential companion for mastering the CAB marketplace.
        </p>

        {/* Call-to-action */}
        <Link href="/trade-calculator" className="mt-4">
          <button
            className="px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:brightness-110 active:translate-y-1 md:text-base"
            style={{
              background: "#7cb3ff",
              color: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 6px 0 0 #1e3a5f, inset 0 2px 0 0 rgba(255,255,255,0.4)",
              border: "3px solid #1e3a5f",
              fontFamily: "var(--font-pixel), monospace",
              textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
            }}
          >
            Get Started
          </button>
        </Link>
      </div>
    </main>
  );
}
